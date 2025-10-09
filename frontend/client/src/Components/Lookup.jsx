import React from "react";
import { DataGrid } from "@mui/x-data-grid";

const Lookup = ({ lookups = {}, attribute, open, onClose, LookupValue }) => {
  // Get lookup rows for the selected attribute or empty array
  const rows = lookups[attribute] || [];

  // Prepare rows with id for DataGrid (assuming each item has a unique Value or index)
  const gridRows = rows.map((item, index) => ({
    id: index,
    ...item,
  }));

  // If no rows, columns = empty array
  let columns = [];

  if (rows.length > 0) {
    // Get keys from first item
    const keys = Object.keys(rows[0]);

    // Map keys to DataGrid column definitions
    columns = keys.map((key) => ({
      field: key,
      headerName: key.replace(/_/g, " "), // replace _ with space for nicer header
      width: 150,
      // Optionally add renderCell for formatting, etc.
    }));
  }

  const handleRowClick = (params) => {
    LookupValue(params.row.Value); // Send selected lookup value back
    onClose();
  };

  return (
    <div style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={gridRows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        onRowClick={handleRowClick}
        disableSelectionOnClick
      />
    </div>
  );
};

export default Lookup;
