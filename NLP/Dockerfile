# Use official Python image
FROM python:alpine
# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port
EXPOSE 9000

# Set environment variables (optional, can be overridden)
ENV OLLAMA_HOST=http://host.docker.internal:11434
ENV OLLAMA_MODEL=mistral

# Run the Flask app
CMD ["python", "app.py"]
