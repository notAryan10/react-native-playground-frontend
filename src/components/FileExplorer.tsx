'use client';

import React, { useState } from 'react';
import {
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FileCode,
  FilePlus,
  FolderPlus,
} from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files: FileNode[];
  currentFile: string | null;
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (path: string) => void;
  onFileRename: (path: string, newName: string) => void;
  theme: 'dark' | 'light';
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  theme,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [creatingFile, setCreatingFile] = useState<{ parentPath: string; type: 'file' | 'folder' } | null>(null);

  const themeColors = theme === 'dark'
    ? {
        bg: '#1e1e1e',
        bgHover: '#2a2d2e',
        bgActive: '#37373d',
        border: '#3e3e42',
        text: '#cccccc',
        textSecondary: '#858585',
        accent: '#007acc',
      }
    : {
        bg: '#ffffff',
        bgHover: '#f3f4f6',
        bgActive: '#e5e7eb',
        border: '#d1d5db',
        text: '#1f2937',
        textSecondary: '#6b7280',
        accent: '#2563eb',
      };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileRename = (path: string, newName: string) => {
    if (newName && newName !== path.split('/').pop()) {
      onFileRename(path, newName);
    }
    setRenamingFile(null);
    setNewFileName('');
  };

  const handleFileCreate = (parentPath: string, name: string, type: 'file' | 'folder') => {
    if (name) {
      onFileCreate(parentPath, name, type);
    }
    setCreatingFile(null);
    setNewFileName('');
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { className: 'w-4 h-4', style: { color: themeColors.textSecondary } };
    
    if (ext === 'tsx' || ext === 'jsx') {
      return <FileCode {...iconProps} style={{ color: '#61dafb' }} />;
    } else if (ext === 'ts' || ext === 'js') {
      return <FileCode {...iconProps} style={{ color: '#f7df1e' }} />;
    } else if (ext === 'json') {
      return <FileCode {...iconProps} style={{ color: '#ffa500' }} />;
    }
    return <File {...iconProps} />;
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = currentFile === node.path;
    const isRenaming = renamingFile === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <div
            className="group flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-opacity-50 transition-colors"
            style={{
              paddingLeft: `${depth * 12 + 8}px`,
              backgroundColor: isActive ? themeColors.bgActive : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = themeColors.bgHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: themeColors.textSecondary }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: themeColors.textSecondary }} />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4" style={{ color: '#ffa500' }} />
            ) : (
              <Folder className="w-4 h-4" style={{ color: '#ffa500' }} />
            )}
            {isRenaming ? (
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => handleFileRename(node.path, newFileName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFileRename(node.path, newFileName);
                  } else if (e.key === 'Escape') {
                    setRenamingFile(null);
                    setNewFileName('');
                  }
                }}
                autoFocus
                className="flex-1 px-1 outline-none"
                style={{
                  backgroundColor: themeColors.bg,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.accent}`,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm" style={{ color: themeColors.text }}>
                {node.name}
              </span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingFile({ parentPath: node.path, type: 'file' });
                  setExpandedFolders(new Set(expandedFolders).add(node.path));
                }}
                className="p-1 hover:bg-opacity-50 rounded"
                style={{ color: themeColors.textSecondary }}
                title="New File"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingFile({ parentPath: node.path, type: 'folder' });
                  setExpandedFolders(new Set(expandedFolders).add(node.path));
                }}
                className="p-1 hover:bg-opacity-50 rounded"
                style={{ color: themeColors.textSecondary }}
                title="New Folder"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingFile(node.path);
                  setNewFileName(node.name);
                }}
                className="p-1 hover:bg-opacity-50 rounded"
                style={{ color: themeColors.textSecondary }}
                title="Rename"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete folder "${node.name}"?`)) {
                    onFileDelete(node.path);
                  }
                }}
                className="p-1 hover:bg-opacity-50 rounded"
                style={{ color: '#ef4444' }}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {isExpanded && (
            <div>
              {creatingFile && creatingFile.parentPath === node.path && (
                <div
                  className="flex items-center gap-1 px-2 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
                >
                  {creatingFile.type === 'file' ? (
                    <File className="w-4 h-4" style={{ color: themeColors.textSecondary }} />
                  ) : (
                    <Folder className="w-4 h-4" style={{ color: '#ffa500' }} />
                  )}
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={() => handleFileCreate(creatingFile.parentPath, newFileName, creatingFile.type)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFileCreate(creatingFile.parentPath, newFileName, creatingFile.type);
                      } else if (e.key === 'Escape') {
                        setCreatingFile(null);
                        setNewFileName('');
                      }
                    }}
                    placeholder={creatingFile.type === 'file' ? 'filename.tsx' : 'folder-name'}
                    autoFocus
                    className="flex-1 px-1 text-sm outline-none"
                    style={{
                      backgroundColor: themeColors.bg,
                      color: themeColors.text,
                      border: `1px solid ${themeColors.accent}`,
                    }}
                  />
                </div>
              )}
              {node.children?.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    return (
      <div
        key={node.id}
        className="group flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-opacity-50 transition-colors"
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          backgroundColor: isActive ? themeColors.bgActive : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = themeColors.bgHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => onFileSelect(node)}
      >
        {getFileIcon(node.name)}
        {isRenaming ? (
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => handleFileRename(node.path, newFileName)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFileRename(node.path, newFileName);
              } else if (e.key === 'Escape') {
                setRenamingFile(null);
                setNewFileName('');
              }
            }}
            autoFocus
            className="flex-1 px-1 text-sm outline-none"
            style={{
              backgroundColor: themeColors.bg,
              color: themeColors.text,
              border: `1px solid ${themeColors.accent}`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm" style={{ color: themeColors.text }}>
            {node.name}
          </span>
        )}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenamingFile(node.path);
              setNewFileName(node.name);
            }}
            className="p-1 hover:bg-opacity-50 rounded"
            style={{ color: themeColors.textSecondary }}
            title="Rename"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete file "${node.name}"?`)) {
                onFileDelete(node.path);
              }
            }}
            className="p-1 hover:bg-opacity-50 rounded"
            style={{ color: '#ef4444' }}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: themeColors.bg,
        borderRight: `1px solid ${themeColors.border}`,
      }}
    >
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${themeColors.border}` }}
      >
        <span className="text-xs font-semibold uppercase" style={{ color: themeColors.textSecondary }}>
          Explorer
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCreatingFile({ parentPath: '/', type: 'file' })}
            className="p-1 hover:bg-opacity-50 rounded"
            style={{ color: themeColors.textSecondary }}
            title="New File"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCreatingFile({ parentPath: '/', type: 'folder' })}
            className="p-1 hover:bg-opacity-50 rounded"
            style={{ color: themeColors.textSecondary }}
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {creatingFile && creatingFile.parentPath === '/' && (
          <div className="flex items-center gap-1 px-2 py-1">
            {creatingFile.type === 'file' ? (
              <File className="w-4 h-4" style={{ color: themeColors.textSecondary }} />
            ) : (
              <Folder className="w-4 h-4" style={{ color: '#ffa500' }} />
            )}
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => handleFileCreate('/', newFileName, creatingFile.type)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFileCreate('/', newFileName, creatingFile.type);
                } else if (e.key === 'Escape') {
                  setCreatingFile(null);
                  setNewFileName('');
                }
              }}
              placeholder={creatingFile.type === 'file' ? 'filename.tsx' : 'folder-name'}
              autoFocus
              className="flex-1 px-1 text-sm outline-none"
              style={{
                backgroundColor: themeColors.bg,
                color: themeColors.text,
                border: `1px solid ${themeColors.accent}`,
              }}
            />
          </div>
        )}
        {files.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
};

export default FileExplorer;
