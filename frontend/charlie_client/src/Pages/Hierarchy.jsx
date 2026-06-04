import React, { useState, useEffect } from 'react';
import api from "../services/api";
import './Hierarchy.css';

const TreeNode = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getMandatoryBadge = () => {
    if (node['Mandatory_Objects']) {
      return <span className="mandatory-badge">Required</span>;
    }
    if (node['Required - Helper Text']) {
      return <span className="conditional-badge">Conditional</span>;
    }
    return null;
  };

  return (
    <div className="tree-node" style={{ '--node-level': level }}>
      <div className="tree-node-content">
        <div className="tree-node-header">
          {hasChildren && (
            <button
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              onClick={toggleExpand}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              ▶
            </button>
          )}
          {!hasChildren && <span className="expand-spacer"></span>}

          <span className="node-icon">📋</span>
          <span className="node-name">{node.name}</span>
          {getMandatoryBadge()}
        </div>

        {node.file && (
          <div className="node-meta">
            <span className="meta-label">File:</span>
            <span className="meta-value">{node.file}</span>
          </div>
        )}

        {node.dat_template && (
          <div className="node-meta">
            <span className="meta-label">Template:</span>
            <span className="meta-value">{node.dat_template}</span>
          </div>
        )}

        {node['Supported Action - Helper Text'] && (
          <div className="node-meta">
            <span className="meta-label">Actions:</span>
            <span className="meta-value action-text">{node['Supported Action - Helper Text']}</span>
          </div>
        )}

        {node['Required - Helper Text'] && (
          <div className="node-meta">
            <span className="meta-label">Required:</span>
            <span className="meta-value">{node['Required - Helper Text']}</span>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Hierarchy = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHierarchyData = async () => {
      try {
        setLoading(true);
        const response = await api.get("utils/hdl/menu-items");
        
        // Extract hierarchy from response - backend returns { hierarchy: [...] }
        let data = response.data;
        
        // If response has a 'hierarchy' property, use that
        if (data && typeof data === 'object' && 'hierarchy' in data) {
          data = data.hierarchy;
        }
        
        // Ensure data is an array
        const hierarchyArray = Array.isArray(data) ? data : [data];
        
        setHierarchyData(hierarchyArray);
        setError(null);
      } catch (err) {
        console.error("Error fetching hierarchy data:", err);
        setError("Failed to load hierarchy from backend");
        setHierarchyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchyData();
  }, []);

  // Simple search filter
  const filterTree = (node, searchText) => {
    if (!searchText) return node;

    const matchesSearch = node.name.toLowerCase().includes(searchText.toLowerCase());
    const filteredChildren = node.children
      ? node.children.map(child => filterTree(child, searchText)).filter(child => child !== null)
      : [];

    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }

    return null;
  };

  const displayData = searchTerm
    ? hierarchyData.filter(node => filterTree(node, searchTerm) !== null).map(node => filterTree(node, searchTerm))
    : hierarchyData;

  if (loading) {
    return (
      <div className="hierarchy-container">
        <div className="center-content">
          <div className="spinner"></div>
          <p>Loading hierarchy data from backend...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hierarchy-container">
        <div className="error-content">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Make sure the backend API is reachable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hierarchy-container">
      <div className="hierarchy-header">
        <h1 className="hierarchy-title">HDL Data Hierarchy</h1>
        <p className="hierarchy-subtitle">Explore the complete hierarchy structure of all data objects and templates</p>
      </div>

      <div className="hierarchy-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search hierarchy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="hierarchy-search"
          />
        </div>

        <div className="action-buttons">
          <button
            className="control-button"
            onClick={() => setExpandAll(!expandAll)}
            title={expandAll ? 'Collapse all nodes' : 'Expand all nodes'}
          >
            {expandAll ? '📥 Collapse All' : '📤 Expand All'}
          </button>
        </div>
      </div>

      <div className="hierarchy-tree">
        {displayData.length > 0 ? (
          displayData.map((node, index) => (
            <TreeNode key={index} node={node} level={0} />
          ))
        ) : (
          <div className="hierarchy-empty">
            <p>No results found for "{searchTerm}"</p>
            <p className="empty-hint">Try searching for different terms</p>
          </div>
        )}
      </div>

      <div className="hierarchy-legend">
        <div className="legend-item">
          <span className="mandatory-badge">Required</span>
          <span className="legend-text">Mandatory object for new records</span>
        </div>
        <div className="legend-item">
          <span className="conditional-badge">Conditional</span>
          <span className="legend-text">Required based on conditions</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">📋</span>
          <span className="legend-text">Data object or template</span>
        </div>
      </div>
    </div>
  );
};

export default Hierarchy;
