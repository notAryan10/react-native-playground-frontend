'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SettingsPanel, Settings } from './SettingsPanel';
import { FileExplorer, FileNode } from './FileExplorer';
import { generateReactNativeTemplate, emptyProject } from '../utils/templates';
const MonacoPlayground = dynamic(() => import('./MonacoPlayground'), { ssr: false });
const StreamViewer = dynamic(() => import('./StreamViewer'), { ssr: false });
import { ArrowLeft, Clock, Download, Settings as SettingsIcon, HelpCircle, FileText, FolderPlus, Sparkles } from 'lucide-react';

export default function PlaygroundLayout() {
  const [showSettings, setShowSettings] = useState(false);
  const backendBase = 'http://localhost:3300';
  const [currentSettings, setCurrentSettings] = useState<Settings>({
    fontSize: 14,
    theme: 'dark',
    lineNumbers: true,
    autoSave: true,
    formatOnSave: false,
    minimap: false,
    autoRefresh: true,
    showConsoleErrors: true
  });

  // File management state
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const n of nodes) {
      if (n.type === 'file') return n;
      if (n.children && n.children.length) {
        const f = findFirstFile(n.children);
        if (f) return f;
      }
    }
    return null;
  };

  // Initialize: load project from isolated backend or create one from template
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const existingId = localStorage.getItem('rn-project-id');
        if (existingId) {
          const res = await fetch(`${backendBase}/api/projects/${existingId}`);
          if (res.ok) {
            const data = await res.json();
            if (cancelled) return;
            setProjectId(data.id);
            setFiles(data.files || []);
            setCurrentFile(findFirstFile(data.files || []));
            return;
          }
        }

        // No project found -> create new with template
        const template = generateReactNativeTemplate();
        const createRes = await fetch(`${backendBase}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Playground Project', files: template })
        });
        if (!createRes.ok) throw new Error('Failed to create project');
        const created = await createRes.json();
        if (cancelled) return;
        localStorage.setItem('rn-project-id', created.id);
        setProjectId(created.id);
        setFiles(template);
        setCurrentFile(findFirstFile(template));
      } catch (e) {
        console.error('Init project failed', e);
        // graceful fallback: local template only
        const template = generateReactNativeTemplate();
        setFiles(template);
        setCurrentFile(findFirstFile(template));
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Debounced persist to isolated backend
  useEffect(() => {
    if (!projectId) return;
    if (!files || files.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${backendBase}/api/projects/${projectId}/files`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files })
        });
        if (res.ok) {
          setLastSaved(new Date());
        }
      } catch (e) {
        console.warn('Save skipped (backend not available)', e);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [files, projectId]);

  // Auto-save current file
  useEffect(() => {
    if (currentSettings.autoSave && currentFile) {
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        console.log('Auto-saved at:', new Date().toLocaleTimeString());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentFile, currentSettings.autoSave]);

  useEffect(() => {
    const savedCode = localStorage.getItem('playground-code');
    if (savedCode && files.length === 0) {
      // Migrate old code to new file structure
      const template = emptyProject();
      if (template[0]) {
        template[0].content = savedCode;
      }
      setFiles(template);
      setCurrentFile(template[0]);
    }
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentSettings.theme);
  }, [currentSettings.theme]);

  const handleSaveSettings = (newSettings: Settings) => {
    setCurrentSettings(newSettings);
    localStorage.setItem('playground-settings', JSON.stringify(newSettings));
    console.log('Settings updated:', newSettings);
  };
  useEffect(() => {
    const savedSettings = localStorage.getItem('playground-settings');
    if (savedSettings) {
      setCurrentSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    if (currentFile) {
      // Update the current file's content
      const updateFileContent = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === currentFile.path) {
            return { ...node, content: newCode };
          }
          if (node.children) {
            return { ...node, children: updateFileContent(node.children) };
          }
          return node;
        });
      };

      const updatedFiles = updateFileContent(files);
      setFiles(updatedFiles);
      setCurrentFile({ ...currentFile, content: newCode });

      if (currentSettings.formatOnSave) {
        console.log('Formatting code...');
      }
    }
  };

  // File management handlers
  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setCurrentFile(file);
    }
  };

  const handleFileCreate = (parentPath: string, name: string, type: 'file' | 'folder') => {
    const newNode: FileNode = {
      id: Date.now().toString(),
      name,
      type,
      path: parentPath === '/' ? `/${name}` : `${parentPath}/${name}`,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined,
    };

    const addToTree = (nodes: FileNode[]): FileNode[] => {
      if (parentPath === '/') {
        return [...nodes, newNode];
      }

      return nodes.map(node => {
        if (node.path === parentPath && node.type === 'folder') {
          return {
            ...node,
            children: [...(node.children || []), newNode],
          };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    const updatedFiles = addToTree(files);
    setFiles(updatedFiles);

    if (type === 'file') {
      setCurrentFile(newNode);
    }
  };

  const handleFileDelete = (path: string) => {
    const deleteFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter(node => node.path !== path)
        .map(node => ({
          ...node,
          children: node.children ? deleteFromTree(node.children) : undefined,
        }));
    };

    const updatedFiles = deleteFromTree(files);
    setFiles(updatedFiles);

    if (currentFile?.path === path) {
      setCurrentFile(updatedFiles.length > 0 ? updatedFiles[0] : null);
    }
  };

  const handleFileRename = (path: string, newName: string) => {
    const renameInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path) {
          const pathParts = path.split('/');
          pathParts[pathParts.length - 1] = newName;
          const newPath = pathParts.join('/');
          return { ...node, name: newName, path: newPath };
        }
        if (node.children) {
          return { ...node, children: renameInTree(node.children) };
        }
        return node;
      });
    };

    const updatedFiles = renameInTree(files);
    setFiles(updatedFiles);

    if (currentFile?.path === path) {
      const updatedCurrentFile = updatedFiles.find(f => f.name === newName);
      if (updatedCurrentFile) {
        setCurrentFile(updatedCurrentFile);
      }
    }
  };

  const loadTemplate = (templateName: 'crud' | 'empty') => {
    const template = templateName === 'crud' ? generateReactNativeTemplate() : emptyProject();
    setFiles(template);
    setCurrentFile(template[0]);
  };

  const bundleAndPreview = async () => {
    setIsBuilding(true);
    setBuildError(null);

    try {
      const response = await fetch('http://localhost:3000/api/bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        throw new Error('Failed to bundle project');
      }

      const data = await response.json();
      setPreviewUrl(`http://localhost:3000${data.previewUrl}`);
    } catch (error: any) {
      console.error('Build error:', error);
      setBuildError(error.message || 'Failed to build preview');
    } finally {
      setIsBuilding(false);
    }
  };

  // Auto-refresh preview when autoRefresh is enabled and files change
  useEffect(() => {
    if (currentSettings.autoRefresh && files.length > 0) {
      const timer = setTimeout(() => {
        bundleAndPreview();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [files, currentSettings.autoRefresh]);
  const themeColors = currentSettings.theme === 'dark'
    ? {
      bg: '#1e1e1e',
      bgSecondary: '#252526',
      bgTertiary: '#333333',
      border: '#3e3e42',
      text: '#ffffff',
      textSecondary: '#9ca3af'
    }
    : {
      bg: '#ffffff',
      bgSecondary: '#f3f4f6',
      bgTertiary: '#e5e7eb',
      border: '#d1d5db',
      text: '#111827',
      textSecondary: '#6b7280'
    };

  return (
    <div
      className="h-screen w-screen flex flex-col"
      style={{
        backgroundColor: themeColors.bg,
        color: themeColors.text
      }}
    >
      <div
        className="h-14 flex items-center justify-between px-4"
        style={{
          backgroundColor: themeColors.bgSecondary,
          borderBottom: `1px solid ${themeColors.border}`
        }}
      >
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div
            className="h-6 w-px"
            style={{ backgroundColor: themeColors.border }}
          ></div>
          <h1 className="text-sm font-medium">Playground Title</h1>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded"
            style={{ backgroundColor: themeColors.bg }}
          >
            <span className="text-sm" style={{ color: themeColors.textSecondary }}>
              Total XP
            </span>
            <span className="text-yellow-500">⚡</span>
            <span className="font-semibold">15,703</span>
          </div>
          {projectId && (
            <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: themeColors.bg, color: themeColors.textSecondary }}>
              Project: {projectId.slice(0, 6)}…
            </div>
          )}
          {currentSettings.autoSave && lastSaved && (
            <div className="text-xs" style={{ color: themeColors.textSecondary }}>
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}

          <button
            className="p-2 rounded hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <Clock className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <Download className="w-5 h-5" />
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium text-sm text-white">
            Submit Solution
          </button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div
          className="w-12 flex flex-col items-center py-3 gap-3"
          style={{
            backgroundColor: themeColors.bgTertiary,
            borderRight: `1px solid ${themeColors.border}`
          }}
        >
          <button
            className="w-9 h-9 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <FileText className="w-5 h-5" />
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            style={{ color: themeColors.textSecondary }}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: themeColors.bg }}
            >
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{
                  backgroundColor: themeColors.bgSecondary,
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                <span className="text-xs font-semibold uppercase" style={{ color: themeColors.textSecondary }}>
                  Project
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadTemplate('crud')}
                    className="p-1 hover:bg-opacity-50 rounded"
                    style={{ color: themeColors.textSecondary }}
                    title="Load CRUD Template"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadTemplate('empty')}
                    className="p-1 hover:bg-opacity-50 rounded"
                    style={{ color: themeColors.textSecondary }}
                    title="New Empty Project"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <FileExplorer
                files={files}
                currentFile={currentFile?.path || null}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
                theme={currentSettings.theme}
              />
            </div>
          </Panel>
          <PanelResizeHandle
            className="w-1 hover:bg-blue-500 transition-colors cursor-col-resize"
            style={{ backgroundColor: themeColors.border }}
          />
          <Panel defaultSize={50} minSize={30}>
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: themeColors.bg }}
            >
              <div
                className="px-4 py-2 flex items-center justify-between text-sm"
                style={{
                  backgroundColor: themeColors.bgSecondary,
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                <span className="font-medium">{currentFile?.name || 'No file selected'}</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: themeColors.textSecondary }}>
                    Font: {currentSettings.fontSize}px
                  </span>
                  {currentSettings.minimap && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: themeColors.bg }}
                    >
                      Minimap On
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {currentFile && currentFile.type === 'file' ? (
                  <MonacoPlayground
                    value={currentFile.content || ''}
                    onChange={handleCodeChange}
                    settings={currentSettings}
                    language={currentFile.name.endsWith('.json') ? 'json' : 
                             currentFile.name.endsWith('.md') ? 'markdown' : 'typescript'}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center" style={{ color: themeColors.textSecondary }}>
                    <p>Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <PanelResizeHandle
            className="w-1 hover:bg-blue-500 transition-colors cursor-col-resize"
            style={{ backgroundColor: themeColors.border }}
          />
          <Panel defaultSize={30} minSize={20} maxSize={50}>
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: themeColors.bgSecondary }}
            >
              <div
                className="px-4 py-2 flex items-center justify-between text-sm"
                style={{
                  backgroundColor: themeColors.bgSecondary,
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                <span className="font-medium">Preview</span>
                <div className="flex items-center gap-2">
                  {isBuilding && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-600 text-white">
                      Building...
                    </span>
                  )}
                  {currentSettings.autoRefresh && !isBuilding && (
                    <span
                      className="text-xs px-2 py-0.5 rounded bg-green-600 text-white"
                    >
                      Auto Refresh
                    </span>
                  )}
                  {!currentSettings.autoRefresh && (
                    <button
                      onClick={bundleAndPreview}
                      disabled={isBuilding}
                      className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isBuilding ? 'Building...' : 'Refresh'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {buildError ? (
                  <div className="h-full flex items-center justify-center p-4">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">Build Error</p>
                      <p style={{ color: themeColors.textSecondary }} className="text-sm">
                        {buildError}
                      </p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="React Native Web Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center" style={{ color: themeColors.textSecondary }}>
                    <div className="text-center">
                      <p className="mb-2">No preview available</p>
                      <button
                        onClick={bundleAndPreview}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Build Preview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialSettings={currentSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}