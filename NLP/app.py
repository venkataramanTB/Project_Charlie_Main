import os
import json
import csv
import io
from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import pandas as pd
import traceback
import re
import logging
import sys
from difflib import get_close_matches

app = Flask(__name__)

# --- Allowed Access Endpoints --- add localhost:3000
@app.after_request
def add_cors_headers(response):
    """
    Add CORS headers to allow requests from localhost:3000.
    This is necessary for the frontend to communicate with this Flask backend.
    """
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response

# --- Configure Logging for Console Output ---
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG) # Set to DEBUG to see all detailed logs

console_handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s')
console_handler.setFormatter(formatter)

# Clear any existing handlers to prevent duplicate log messages
if app.logger.handlers:
    for handler in app.logger.handlers:
        app.logger.removeHandler(handler)
if logger.handlers:
    for handler in logger.handlers:
        logger.removeHandler(handler)

logger.addHandler(console_handler)
app.logger.addHandler(console_handler)
app.logger.setLevel(logging.DEBUG) # Ensure Flask's internal logger is also DEBUG


# Configure Gemini client
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyCCFXd3bAAVonA9FAf2kvRlcnt6wKFkaHw')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')

model = None
if not GEMINI_API_KEY:
    logger.critical("GEMINI_API_KEY is not set. The application will not be able to generate validation code.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        # A simple test to check if the model is accessible.
        model.generate_content("test", generation_config=genai.types.GenerationConfig(max_output_tokens=1))
        logger.info(f"Gemini client initialized successfully with model: {GEMINI_MODEL}")
    except Exception as e:
        logger.critical(f"Failed to initialize Gemini client. Please check your API key and model name. Error: {e}", exc_info=True)
        model = None

MAX_RETRIES = 10 # Maximum attempts for code generation and execution

# --- Helper Functions ---

def sanitize_value_for_json(value):
    """
    Converts pandas NaN (Not a Number) values to Python's None,
    and also handles potential string representations of NaN.
    This is critical for valid JSON output. This is a recursive sanitizer.
    """
    if isinstance(value, dict):
        return {k: sanitize_value_for_json(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_value_for_json(elem) for elem in value]
    elif isinstance(value, float) and value != value: # Checks for np.nan, float('nan')
        logger.debug(f"Sanitizing value: Detected standard float NaN. Converting to None.")
        return None
    elif pd.isna(value): # Robust check for various pandas NaN-like values (np.nan, None, pd.NA)
        logger.debug(f"Sanitizing value: Detected pd.isna() value. Converting to None.")
        return None
    elif isinstance(value, str) and value.lower() == 'nan':
        logger.debug(f"Sanitizing value: Detected string 'NaN'. Converting to None.")
        return None
    return value


def parse_validation_rules(validation_content):
    """
    Parses the validation content (TXT/JSON) and extracts rules.
    It expects a JSON object with a "validations" key containing a list of dictionaries,
    where each dictionary defines columns and their validation rules as strings.
    """
    logger.debug("Attempting to parse validation content.")
    try:
        data = json.loads(validation_content)
        if "validations" in data and isinstance(data["validations"], list):
            if data["validations"]:
                logger.info("Successfully parsed validation rules from content.")
                logger.debug(f"Parsed rules: {data['validations'][0]}")
                return data["validations"][0]
            else:
                logger.warning("Validation content has 'validations' key but the list is empty.")
                return {}
        else:
            logger.warning("Validation content does not have a 'validations' key or it's not a list.")
            return {}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse validation file as JSON. Error: {e}")
        return {}
    except Exception as e:
        logger.error(f"An unexpected error occurred while parsing validation rules: {e}", exc_info=True)
        return {}

def generate_validation_code(validation_rules, existing_code_with_error=None): # Removed csv_headers argument
    """
    Generates Python code for validation based on rules using the LLM.
    If `existing_code_with_error` is provided (from a previous failed attempt),
    it attempts to rectify the code by including the error details in the prompt.
    """
    if not model:
        logger.error("Gemini model is not initialized. Cannot generate validation code.")
        return None

    active_rules = {col: rule for col, rule in validation_rules.items() if rule}
    formatted_rules = "\n".join([f"- Column '{col}': '{rule}'" for col, rule in active_rules.items()])
    logger.debug(f"Formatting rules for LLM prompt. Active rules: {list(active_rules.keys())}")

    prompt_parts = [
        "You are an expert Python programmer.",
        "Your task is to generate a Python function named `validate_row` for validating a single row of tabular data.",
        "",
        "### Function Signature:",
        "- The function **must** be defined as:",
        "```python",
        "def validate_row(row: dict, row_number: int) -> tuple:",
        "```",
        "- It must return `(True, None)` if the row is valid, or `(False, 'Failure Reason')` if invalid.",
        "",
        "### Function Scope Rules:",
        "- The function operates **only on a single row** (dictionary).",
        "- Never reference or use any variable named `df`, `dataframe`, `rows`, `dataset`, or similar — the backend will call this function row-by-row.",
        "- Do **not** attempt to access other rows, global variables, or external files.",
        "- You cannot assume access to any external dataset or database.",
        "",
        "### Validation Rules:",
        f"{formatted_rules}",
        "",
        "### Implementation Notes:",
        "- All necessary imports (like `re`, `datetime`, `pandas`) must be **inside** the function.",
        "- Use `row.get('ColumnName', '')` to access values safely (avoid KeyErrors).",
        "- If multiple validation failures occur, append all reasons to a list and join them into one string.",
        "- Return `(True, None)` if no failures are found.",
        "- Handle missing or null values gracefully.",
        "- **Datetime Handling:** For any datetime columns listed in the validation rules, convert any string or timestamp to a Python `datetime` object, then normalize it to the format `'%Y-%m-%d'`. Treat unparsable or missing dates as invalid and include them in failure reasons.",
        "- Strictly change the datetime format to '%Y-%m-%d' from '%Y-%m-%d %H:%M:%S'",
        "- Do not add example usage, print statements, or global code — only the function definition.",
        "",
        "### Critical Rule:",
        "- Only generate logic for columns explicitly mentioned in the 'Validation Rules' above.",
        "- Do not create inferred or generic validations (like string lengths or numeric checks) unless they are explicitly listed."
    ]


    if existing_code_with_error:
        logger.info("Retrying code generation with previous error details.")
        prompt_parts.append(f"\nI previously generated this code:\n```python\n{existing_code_with_error['code']}\n```\n")
        prompt_parts.append(f"It failed with the following error:\n```\n{existing_code_with_error['error']}\n```\n")
        prompt_parts.append("Please provide only the corrected `validate_row` function. Ensure the fix addresses the error and maintains all original requirements.")
        # Add more explicit error feedback for LLM
        prompt_parts.append("\nIf you previously failed to generate valid Python code, analyze the error and fix it. If the rule is complex, break it down into clear logical steps in the code. Always use try/except blocks for ambiguous logic and document any assumptions in the failure reason.\n")
    else:
        logger.info("Generating initial validation code.")
        prompt_parts.append("\nGenerate only the Python code for the `validate_row` function.")
        # Add more explicit instruction for complex/compound rules
        prompt_parts.append("\nIf the rule is complex or compound (e.g., contains 'and', 'or', or conditional logic), break it down into clear logical steps in the code. Use case-insensitive string checks and handle missing or unexpected values gracefully.\n")

    # Add extra prompt for LLM to deeply analyze and reason about the human prompt
    prompt_parts.append(
        "\n---\nIMPORTANT: The rule(s) provided may be in natural human language, possibly ambiguous, and may reference columns in a case-insensitive or fuzzy way. You must deeply analyze the intent, reason about the logic, and generate robust validation code that matches the user's intent as closely as possible. If a rule is ambiguous, make a reasonable assumption and document it in the failure reason. Always use case-insensitive comparisons for string checks.\n---\n"
    )

    full_prompt = "\n".join(prompt_parts)
    logger.info(f"Sending prompt to LLM (length: {len(full_prompt)} characters).")
    logger.debug(f"--- FULL LLM PROMPT START ---\n{full_prompt}\n--- FULL LLM PROMPT END ---")

    try:
        # Gemini may have stricter safety settings. Disabling them for this specific task.
        safety_settings = {
            "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
            "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
            "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
            "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
        }
        response = model.generate_content(full_prompt, safety_settings=safety_settings)
        generated_text = response.text.strip()
        logger.debug(f"Raw Gemini response received (length: {len(generated_text)} characters).")

        match = re.search(r"```python\s*(.*?)\s*```", generated_text, re.DOTALL)
        if match:
            extracted_code = match.group(1).strip()
            logger.info("Successfully extracted Python code block from Gemini response.")
            logger.debug(f"--- EXTRACTED CODE START ---\n{extracted_code}\n--- EXTRACTED CODE END ---")
            return extracted_code
        else:
            logger.warning(f"Could not find a Python code block in Gemini response. Returning raw text for debugging.")
            logger.debug(f"--- RAW GEMINI RESPONSE (NO CODE BLOCK) START ---\n{generated_text}\n--- RAW GEMINI RESPONSE (NO CODE BLOCK) END ---")
            return generated_text
    except Exception as e:
        logger.error(f"Error calling Gemini API during code generation: {e}", exc_info=True)
        return None

def execute_validation_code(code_string, df):
    """
    Executes the generated validation code dynamically and applies it to each row of the DataFrame.
    """
    local_scope = {}
    try:
        logger.info("Attempting to execute generated validation code dynamically.")
        # Provide necessary imports like 're' and 'datetime' to the scope where `code_string` executes
        exec(code_string, {'re': re, 'datetime': __import__('datetime')}, local_scope)

        validate_row = local_scope.get('validate_row')

        if not validate_row:
            logger.error("Error: 'validate_row' function not found in generated code after execution.")
            return False, "Error: 'validate_row' function not found in generated code."

        passed_rows = []
        failed_rows = []
        num_rows = len(df)
        logger.info(f"Starting validation for {num_rows} rows.")

        for i, row_series in df.iterrows():
            row_dict = row_series.to_dict()
            row_number = i + 2 # Calculate 1-based row number, accounting for header row
            logger.debug(f"Validating row {row_number}/{num_rows}.")

            is_valid, reason = validate_row(row_dict, row_number)
            if not is_valid:
                failed_rows.append({
                    "row_number": row_number,
                    "row_data": sanitize_value_for_json(row_dict), # Using the recursive sanitizer
                    "failure_reason": reason
                })
                logger.info(f"Row {row_number} FAILED validation: {reason}")
            else:
                passed_rows.append(sanitize_value_for_json(row_dict)) # Using the recursive sanitizer
                logger.debug(f"Row {row_number} PASSED validation.")

        logger.info(f"Validation complete. Total rows: {num_rows}, Passed: {len(passed_rows)}, Failed: {len(failed_rows)}")
        return True, {"passed_rows": passed_rows, "invalid_rows": failed_rows}

    except SyntaxError as e:
        logger.error(f"Syntax Error in generated code. Error: {e}", exc_info=True)
        return False, f"Syntax Error in generated code from LLM. It produced invalid Python: {e}"
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Runtime error during validation execution: {e}\n{error_trace}", exc_info=True)
        return False, f"Runtime error during validation: {e}. Trace: {error_trace}"

@app.route('/')
def index():
    """Renders the main HTML page for the application."""
    logger.info("Serving index.html page.")
    return render_template('index.html')

# --- Global error handler to always return JSON ---
@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    logger.error(f"Unhandled exception: {e}", exc_info=True)
    return jsonify({
        "error": str(e),
        "trace": traceback.format_exc()
    }), 500

@app.route('/validate', methods=['POST'])
def validate_data():
    """
    Handles the data validation request.
    Receives CSV and validation rule files, or rules as form fields, generates and executes validation code,
    and returns validation results.
    """
    logger.info("Received request to /validate endpoint.")

    # --- Accept CSV file and rules from form fields or files ---
    csv_file = request.files.get('csv_file')
    validation_file = request.files.get('validation_file')
    attribute = request.form.get('attribute')
    attributes_raw = request.form.get('attributes')
    rules_raw = request.form.get('rules')

    # Parse attributes and rules as JSON if present
    try:
        all_attributes = json.loads(attributes_raw) if attributes_raw else []
    except Exception:
        all_attributes = []
    try:
        rules = json.loads(rules_raw) if rules_raw else []
    except Exception:
        rules = request.form.getlist('rules')

    # --- Check for CSV file ---
    if not csv_file:
        logger.warning("Request missing 'csv_file'.")
        return jsonify({"error": "Missing CSV file"}), 400
    if not csv_file.filename.endswith('.csv'):
        logger.warning(f"Uploaded data file '{csv_file.filename}' is not a CSV.")
        return jsonify({"error": "Only CSV files are allowed for data"}), 400

    # --- Determine validation rules source ---
    validation_rules = None
    if validation_file and (validation_file.filename.endswith('.json') or validation_file.filename.endswith('.txt')):
        validation_content = validation_file.read().decode('utf-8')
        logger.info("Successfully read uploaded validation file.")
        validation_rules = parse_validation_rules(validation_content)
    elif attribute and rules:
        logger.info("Parsing validation rules from form fields.")
        # If rules is a list with connectors, parse them into a single string rule
        # Example: ["Rule1", "and", "Rule2", "or", "Rule3"]
        if isinstance(rules, list) and len(rules) > 0 and any(isinstance(r, str) for r in rules):
            # Combine rules and connectors into a single string
            rule_str = ""
            for i, item in enumerate(rules):
                if item.strip().lower() in ["and", "or"]:
                    rule_str += f" {item.strip().lower()} "
                else:
                    rule_str += f"({item.strip()})"
            # Auto-correct column names in the rule string using all_attributes (case-insensitive)
            def correct_column_names(rule, attributes):
                # Lowercase all attributes for matching
                attributes_lower = [a.lower() for a in attributes]
                pattern = r"([\w\s]+?)\s+column"
                def replacer(match):
                    col = match.group(1).strip()
                    best = get_close_matches(col.lower(), attributes_lower, n=1, cutoff=0.7)
                    if best:
                        # Return the original-cased attribute
                        idx = attributes_lower.index(best[0])
                        return attributes[idx] + " column"
                    return match.group(0)
                return re.sub(pattern, replacer, rule, flags=re.IGNORECASE)
            rule_str = correct_column_names(rule_str, all_attributes)
            validation_rules = {attribute: rule_str.strip()}
        else:
            validation_rules = {attribute: rules[0] if isinstance(rules, list) and rules else rules}
    else:
        logger.warning("No validation rules provided (neither file nor form fields).")
        return jsonify({"error": "Missing validation rules (file or form fields)"}), 400

    if not validation_rules:
        logger.error("Parsed validation rules are empty or invalid.")
        return jsonify({"error": "Failed to parse validation rules. Please check the format."}), 400
    logger.debug(f"Active validation rules: {list(validation_rules.keys())}")

    try:
        csv_content = csv_file.read().decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))
        csv_headers = df.columns.tolist()
        logger.info(f"CSV data loaded. Headers found: {csv_headers}")
        logger.debug(f"Preview of CSV data (first 3 rows):\n{df.head(3).to_string()}")

        generated_code = None
        current_error = None
        for attempt in range(MAX_RETRIES):
            logger.info(f"Attempt {attempt + 1}/{MAX_RETRIES} to generate and execute validation code.")
            generated_code = generate_validation_code(validation_rules, current_error)

            if not generated_code:
                logger.error(f"Attempt {attempt + 1}: LLM failed to generate any code.")
                if attempt == MAX_RETRIES - 1:
                    return jsonify({"error": "Failed to generate validation code from LLM after multiple attempts."}), 500
                current_error = None
                continue

            # Correct the generated code for column name access
            generated_code = correct_code_column_names(generated_code, csv_headers)

            success, validation_results_data = execute_validation_code(generated_code, df)

            if success:
                logger.info("Validation code executed successfully. Returning results.")
                # Send all rows (no preview limit)
                sanitized_invalid = [sanitize_value_for_json(row) for row in validation_results_data['invalid_rows']]
                sanitized_passed = [sanitize_value_for_json(row) for row in validation_results_data['passed_rows']]
                response_data = {
                    "status": "success",
                    "invalid_rows": sanitized_invalid,
                    "passed_rows": sanitized_passed,
                    "generated_code": generated_code
                }
                logger.debug(f"Response data preview: {json.dumps(response_data, default=str)[:1000]}")
                try:
                    return jsonify(response_data), 200
                except Exception as e:
                    logger.error(f"JSON serialization error: {e}\nData: {repr(response_data)}", exc_info=True)
                    return jsonify({"error": f"Internal server error: Failed to serialize data: {e}"}), 500
            else:
                logger.warning(f"Attempt {attempt + 1}: Validation code execution failed. Error: {validation_results_data}. Retrying...")
                if "Syntax Error" in validation_results_data or "'validate_row' function not found" in validation_results_data or "NameError" in validation_results_data:
                    logger.info("Feeding back code generation error to LLM for correction.")
                    current_error = {"code": generated_code, "error": validation_results_data}
                else:
                    logger.info("Skipping error feedback to LLM as it appears to be a data validation failure, not a code generation error.")
                    current_error = None
        logger.critical(f"All {MAX_RETRIES} attempts failed to generate working validation code. Last known error: {current_error['error'] if current_error else 'None (last failure was data-related)'}")
        return jsonify({"error": "Failed to generate working validation code after multiple retries.", "last_error": current_error}), 500

    except pd.errors.EmptyDataError:
        logger.error("The uploaded CSV file was empty.")
        return jsonify({"error": "The uploaded CSV file is empty. Please upload a CSV with data."}), 400
    except pd.errors.ParserError as e:
        logger.error(f"Error parsing CSV file. Please check its format. Error: {e}", exc_info=True)
        return jsonify({"error": f"Error parsing CSV file. Please check its format: {e}"}), 400
    except Exception as e:
        logger.error(f"An unexpected server error occurred: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}. Check server console for details."}), 500

def correct_code_column_names(code_string, csv_headers):
    """
    Highly naturalized NLP-style: Post-processes the generated code to replace all row.get('...') and row['...'] column names
    with the closest match from csv_headers (case-insensitive, typo-tolerant, robust to word order, punctuation, underscores, dashes, and whitespace).
    Uses token, character, and substring similarity for robust matching.
    Also patches all .lower() calls on row values to use str(...) to avoid AttributeError on float/None/NaN.
    """
    import re
    from difflib import get_close_matches, SequenceMatcher
    import string
    import logging

    def normalize(text):
        # Lowercase, remove punctuation, underscores, dashes, collapse whitespace, strip
        text = text.lower()
        text = text.replace('_', ' ').replace('-', ' ')
        text = text.translate(str.maketrans('', '', string.punctuation))
        text = ' '.join(text.split())
        return text.strip()

    def jaccard_similarity(a, b):
        set_a = set(normalize(a).split())
        set_b = set(normalize(b).split())
        if not set_a or not set_b:
            return 0.0
        return len(set_a & set_b) / len(set_a | set_b)

    def levenshtein_ratio(a, b):
        return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

    def substring_score(a, b):
        # Returns 1.0 if one is substring of the other, else 0.0
        a_norm = normalize(a)
        b_norm = normalize(b)
        return 1.0 if a_norm in b_norm or b_norm in a_norm else 0.0

    def best_nlp_match(col):
        col_norm = normalize(col)
        # 1. Exact match (case-insensitive, normalized)
        for h in csv_headers:
            if normalize(h) == col_norm:
                return h
        # 2. Substring match
        for h in csv_headers:
            if substring_score(col, h) == 1.0:
                return h
        # 3. Jaccard + Levenshtein combined
        best_score = 0
        best_header = col
        for h in csv_headers:
            h_norm = normalize(h)
            jac = jaccard_similarity(col_norm, h_norm)
            lev = levenshtein_ratio(col_norm, h_norm)
            score = 0.5 * jac + 0.5 * lev
            if score > best_score:
                best_score = score
                best_header = h
        # 4. Only replace if strong match (score > 0.5)
        if best_score > 0.5:
            logging.debug(f"Column '{col}' matched to '{best_header}' with score {best_score:.2f}")
            return best_header
        # 5. Fallback to difflib
        best = get_close_matches(col_norm, [normalize(h) for h in csv_headers], n=1, cutoff=0.7)
        if best:
            idx = [normalize(h) for h in csv_headers].index(best[0])
            logging.debug(f"Column '{col}' fallback-matched to '{csv_headers[idx]}' via difflib.")
            return csv_headers[idx]
        logging.warning(f"Column '{col}' could not be confidently matched. Leaving as is.")
        return col

    # Regex for row.get('...') and row['...'] (avoid over-matching)
    def replace_get(match):
        col = match.group(1)
        fixed = best_nlp_match(col)
        return f"row.get('{fixed}', '')"
    code_string = re.sub(r"row\.get\(['\"]([^'\"]+?)['\"](?:,\s*['\"]?[^'\"]*['\"]?)?\)", replace_get, code_string)

    def replace_bracket(match):
        col = match.group(1)
        fixed = best_nlp_match(col)
        return f"row.get('{fixed}', '')"
    code_string = re.sub(r"row\[['\"]([^'\"]+?)['\"]\]", replace_bracket, code_string)

    # Patch all .lower() calls on row.get(...) and row[...] to str(...).lower()
    # row.get('X', '').lower() => str(row.get('X', '')).lower()
    code_string = re.sub(r"(row\.get\([^\)]+\))\.lower\(\)", r"str(\1).lower()", code_string)
    # row['X'].lower() => str(row.get('X', '')).lower() (already replaced above)
    # But if any row['X'].lower() remains, patch it:
    code_string = re.sub(r"(row\[['\"][^'\"]+['\"]\])\.lower\(\)", r"str(\1).lower()", code_string)

    return code_string

if __name__ == '__main__':
    logger.info("Starting Flask application with Gemini API.")
    app.run(debug=False, port=9000)