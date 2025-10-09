import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Box,
  Typography,
  CircularProgress,
  snackbarClasses,
} from "@mui/material";

const SourceNode = ({ data }) => (
  <div
    style={{
      position: "relative",
      padding: 10,
      border: "1px solid #222",
      borderRadius: 5,
      background: "#d1eaff",
      minWidth: 120,
      textAlign: "center",
    }}
  >
    <div>{data.label}</div>
    <Handle
      type="source"
      position={Position.Right}
      id="right"
      style={{
        background: "#555",
        width: 10,
        height: 10,
        borderRadius: "50%",
        right: -5,
        top: "50%",
        transform: "translateY(-50%)",
        position: "absolute",
      }}
    />
  </div>
);

const TargetNode = ({ data }) => (
  <div
    style={{
      position: "relative",
      padding: 10,
      border: "1px solid #222",
      borderRadius: 5,
      background: "#ffe1e6",
      minWidth: 120,
      textAlign: "center",
    }}
  >
    <Handle
      type="target"
      position={Position.Left}
      id="left"
      style={{
        background: "#555",
        width: 10,
        height: 10,
        borderRadius: "50%",
        left: -5,
        top: "50%",
        transform: "translateY(-50%)",
        position: "absolute",
      }}
    />
    <div>{data.label}</div>
  </div>
);

const nodeTypes = {
  sourceNode: SourceNode,
  targetNode: TargetNode,
};

const drawerWidth = 280;
const collapsedWidth = 64;

const DataTransformation = ({
  collapsed,
  initialSelectedAttribute,
  attributeList = [],
  RawExcelFile,
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState(
    initialSelectedAttribute || ""
  );
  const [mapping, setMapping] = useState({}); // Stores the active mapping {source_value: target_value}
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [saving, setSaving] = useState(false);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
  useEffect(() => {
    console.log("HDL_DataTransformation received RawExcelFile:", RawExcelFile);
  }, [RawExcelFile]);

  // Effect to update internal selectedAttribute when initialSelectedAttribute prop changes
  // or when attributeList changes and we need to pick a default
  useEffect(() => {
    if (initialSelectedAttribute) {
      setSelectedAttribute(initialSelectedAttribute);
    } else if (attributeList.length > 0 && !selectedAttribute) {
      // If no specific attribute is passed initially and current selected is empty,
      // default to the first one in the list.
      setSelectedAttribute(attributeList[0].attribute);
    }
  }, [initialSelectedAttribute, attributeList, selectedAttribute]);

  // Effect to fetch mapping data when selectedAttribute changes
  useEffect(() => {
    if (selectedAttribute) {
      fetchMappingData(selectedAttribute);
    } else {
      // Clear nodes and edges if no attribute is selected
      setNodes([]);
      setEdges([]);
      setMapping({});
    }
  }, [selectedAttribute]); // Dependency on selectedAttribute

  const fetchMappingData = async (attribute) => {
    setLoadingMapping(true);
    setNodes([]); // Clear previous nodes/edges before fetching new data
    setEdges([]);
    setMapping({});
    try {
      // Assuming your backend has an endpoint to get mapping for a given attribute
      // This API should return an array of objects like:
      // [{ source_value: "A", target_value: "X" }, { source_value: "B", target_value: "Y" }]
      const response = await axios.get(
        `${apiEndpoint}/api/transform/get-mapping`,
        {
          params: { attribute },
        }
      );

      const fetchedMappings = response.data;

      if (!fetchedMappings || fetchedMappings.length === 0) {
        setNodes([]);
        setEdges([]);
        setMapping({});
        alert("No existing mapping found for this attribute. Start a new mapping.");
        return;
      }

      // Populate mapping state
      setMapping(
        fetchedMappings.reduce((acc, { source_value, target_value }) => {
          acc[`${source_value}`] = `${target_value}`;
          return acc;
        }, {})
      );

      // Create nodes and edges for React Flow
      // Filter out nodes that would have entirely empty labels from the start
      const sourceNodes = fetchedMappings
        .filter((item) => item.source_value !== "") // Only create source node if source_value is not empty
        .map((item, idx) => ({
          id: `source-${item.source_value}`, // Use unique ID based on value
          type: "sourceNode",
          data: { label: item.source_value },
          position: { x: 0, y: idx * 100 },
        }));

      const targetNodes = fetchedMappings
        .filter((item) => item.target_value !== "") // Only create target node if target_value is not empty
        .map((item, idx) => ({
          id: `target-${item.target_value}`, // Use unique ID based on value
          type: "targetNode",
          data: { label: item.target_value },
          position: { x: 400, y: idx * 100 },
        }));

      // Create edges based on the fetched mapping
      const edgeList = fetchedMappings
        .map((item) => {
          // Only create an edge if both source and target values are not empty
          if (item.source_value !== "" && item.target_value !== "") {
            return {
              id: `edge-${item.source_value}-${item.target_value}`,
              source: `source-${item.source_value}`,
              target: `target-${item.target_value}`,
              type: "default",
              animated: true,
              style: {
                stroke: "#9c27b0",
                strokeWidth: 1,
              },
              label: `${item.source_value} to ${item.target_value}`, // More descriptive label
              markerEnd: {
                type: "arrowclosed",
                color: "#9c27b0",
              },
            };
          }
          return null; // Don't create an edge for empty values
        })
        .filter(Boolean); // Remove null entries from the array

      // Filter nodes to ensure only nodes that are part of a valid edge are displayed
      const validSourceNodeLabels = new Set(
        edgeList.map(
          (e) =>
            fetchedMappings.find((fm) => `source-${fm.source_value}` === e.source)
              ?.source_value
        )
      );
      const validTargetNodeLabels = new Set(
        edgeList.map(
          (e) =>
            fetchedMappings.find((fm) => `target-${fm.target_value}` === e.target)
              ?.target_value
        )
      );

      const filteredSourceNodes = sourceNodes.filter((node) =>
        validSourceNodeLabels.has(node.data.label)
      );
      const filteredTargetNodes = targetNodes.filter((node) =>
        validTargetNodeLabels.has(node.data.label)
      );

      setNodes([...filteredSourceNodes, ...filteredTargetNodes]);
      setEdges(edgeList);
    } catch (err) {
      console.error("Error fetching mapping data:", err);
      // Clear nodes/edges on error to avoid stale data
      setNodes([]);
      setEdges([]);
      setMapping({});
    } finally {
      setLoadingMapping(false);
    }
  };

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        // Update mapping to store {source_value: target_value} using data.label
        setMapping((prev) => ({
          ...prev,
          [sourceNode.data.label]: targetNode.data.label,
        }));
        setEdges((eds) => addEdge({ ...params, animated: true, type: "smoothstep" }, eds));
      } else {
        console.warn("Could not find source or target node for connection.");
      }
    },
    [setEdges, nodes]
  );

  const saveMapping = async () => {
    if (Object.keys(mapping).length === 0) {
      alert("No mapping defined. Please create connections before saving.");
      return;
    }
    if (!selectedAttribute) {
      alert("Please select an attribute before saving.");
      return;
    }
    if (!RawExcelFile) {
        alert("Raw Excel File is missing. Please upload the file first.");
        return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("attribute_column", selectedAttribute); // Backend expects attribute_column
      formData.append("raw_excel_file", RawExcelFile); // Send the actual File object
      
      // Create a Blob for the JSON mapping
      const mappingBlob = new Blob([JSON.stringify(mapping)], { type: 'application/json' });
      formData.append("mapping_json_file", mappingBlob, "mapping.json"); // Provide a filename for the blob

      const response = await axios.post(
        `${apiEndpoint}/api/hdl/apply-transformation-and-download`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Important for FormData
          },
          responseType: 'blob' // Expecting a blob response if it's a file download
        }
      );

      // Handle file download
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'transformed_data.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Mapping saved and transformed file downloaded!");
      fetchMappingData(selectedAttribute);
    } catch (err) {
      console.error("Error saving mapping:", err.response ? err.response.data : err);
      // If the error response is a blob, try to read it as text for more detailed error
      if (err.response && err.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const errorData = JSON.parse(reader.result);
            alert(`Failed to save mapping: ${errorData.detail?.[0]?.msg || JSON.stringify(errorData)}`);
          } catch (e) {
            alert("Failed to save mapping. Could not parse error response.");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        alert("Failed to save mapping.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        transform: collapsed ? "scale(1)" : "scale(1)",
        transformOrigin: "left center",
        transition: "all 0.3s ease",
        width: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)`,
      }}
    >
      <div style={{ padding: "2rem" }}>
        <h1>Excel Data Transformer for {selectedAttribute || "Selected Attribute"}</h1>
        <Box mb={3}>
          <FormControl fullWidth sx={{ maxWidth: 400 }}>
            <InputLabel id="attribute-select-label">Selected Attribute</InputLabel>
            <Select
              labelId="attribute-select-label"
              value={selectedAttribute}
              label="Selected Attribute"
              onChange={(e) => setSelectedAttribute(e.target.value)}
              disabled={true} // Disable while loading a new mapping
            >
              {attributeList.map(({ attribute, mapping: currentMapping }, index) => (
                <MenuItem key={index} value={attribute}>
                  {attribute} - {currentMapping || "Not Mapped"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <div
          style={{
            height: "60vh",
            border: "1px solid #ccc",
            borderRadius: "8px",
            position: "relative",
          }}
        >
          {loadingMapping && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Loading Mappings...
              </Typography>
            </Box>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: "#f0f0f0" }}
          >
            <MiniMap />
            <Controls />
            <Background gap={16} variant={BackgroundVariant.Dots} />
          </ReactFlow>
        </div>
      </div>
    </Box>
  );
};

export default DataTransformation;