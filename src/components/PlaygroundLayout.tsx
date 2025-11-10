'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { SettingsPanel, Settings } from './SettingsPanel';
const MonacoPlayground = dynamic(() => import('./MonacoPlayground'), { ssr: false });
import { ArrowLeft, Clock, Download, Settings as SettingsIcon, HelpCircle, FileText } from 'lucide-react';
import ConsolePanel, { LogEntry, LogLevel } from './ConsolePanel';

export default function PlaygroundLayout() {
  const [showSettings, setShowSettings] = useState(false);
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

  const [code, setCode] = useState(`import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello React Native Web!</Text>
      <Text style={styles.subtitle}>
        Edit this code and see it render in the preview.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
`);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [builderLogs, setBuilderLogs] = useState<LogEntry[]>([]);

  const pushLog = (level: LogLevel, message: string) => {
    setLogs(prev => [...prev, { level, message, timestamp: new Date() }]);
  };
  const pushBuilderLog = (level: LogLevel, message: string) => {
    setBuilderLogs(prev => [...prev, { level, message, timestamp: new Date() }]);
  };

  // Auto-save functionality
  useEffect(() => {
    if (currentSettings.autoSave && code) {
      const timer = setTimeout(() => {
        // Save code to localStorage or API
        localStorage.setItem('playground-code', code);
        setLastSaved(new Date());
        console.log('Auto-saved at:', new Date().toLocaleTimeString());
        pushBuilderLog('info', `Auto-saved at: ${new Date().toLocaleTimeString()}`);
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [code, currentSettings.autoSave]);

  // Capture console.* and forward to panel
  useEffect(() => {
    const original = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    } as const;

    const fmt = (args: any[]) => args.map(a => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(' ');

    console.log = (...args: any[]) => { original.log(...args); pushLog('log', fmt(args)); };
    console.info = (...args: any[]) => { original.info(...args); pushLog('info', fmt(args)); };
    console.warn = (...args: any[]) => { original.warn(...args); pushLog('warn', fmt(args)); };
    console.error = (...args: any[]) => { original.error(...args); pushLog('error', fmt(args)); };

    return () => {
      console.log = original.log;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
    };
  }, []);

  // Load saved code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('playground-code');
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentSettings.theme);
  }, [currentSettings.theme]);

  const handleSaveSettings = (newSettings: Settings) => {
    setCurrentSettings(newSettings);
    // Persist settings to localStorage
    localStorage.setItem('playground-settings', JSON.stringify(newSettings));
    console.log('Settings updated:', newSettings);
    pushBuilderLog('info', 'Settings updated');
  };

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('playground-settings');
    if (savedSettings) {
      setCurrentSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Format on save if enabled
    if (currentSettings.formatOnSave) {
      // You can integrate a formatter like prettier here
      console.log('Formatting code...');
    }
  };

  // Theme-based colors
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
      {/* Top Navbar */}
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

          {/* Auto-save indicator */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
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

        {/* Resizable Panels */}
        <PanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Question */}
          <Panel defaultSize={25} minSize={15} maxSize={40}>
            <div
              className="h-full p-6 overflow-auto"
              style={{ backgroundColor: themeColors.bg }}
            >
              <h2 className="text-xl font-bold mb-4">Challenge Description</h2>
              <p style={{ color: themeColors.textSecondary }}>
                Your challenge description goes here...
              </p>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle
            className="w-1 hover:bg-blue-500 transition-colors cursor-col-resize"
            style={{ backgroundColor: themeColors.border }}
          />

          {/* Middle Panel - Editor */}
          <Panel defaultSize={45} minSize={30}>
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: themeColors.bg }}
            >
              {/* Editor Header */}
              <div
                className="px-4 py-2 flex items-center justify-between text-sm"
                style={{
                  backgroundColor: themeColors.bgSecondary,
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                <span className="font-medium">Editor</span>
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

              {/* Editor Content (Monaco) */}
              <div className="flex-1 overflow-hidden">
                <MonacoPlayground
                  value={code}
                  onChange={handleCodeChange}
                  settings={currentSettings}
                  language="typescript"
                />
              </div>
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle
            className="w-1 hover:bg-blue-500 transition-colors cursor-col-resize"
            style={{ backgroundColor: themeColors.border }}
          />

          {/* Right Panel - Preview */}
          <Panel defaultSize={30} minSize={20} maxSize={50}>
            <div
              className="h-full flex flex-col"
              style={{ backgroundColor: themeColors.bgSecondary }}
            >
              {/* Preview Header */}
              <div
                className="px-4 py-2 flex items-center justify-between text-sm"
                style={{
                  backgroundColor: themeColors.bgSecondary,
                  borderBottom: `1px solid ${themeColors.border}`
                }}
              >
                <span className="font-medium">Preview</span>
                <div className="flex items-center gap-2">
                  {currentSettings.autoRefresh && (
                    <span
                      className="text-xs px-2 py-0.5 rounded bg-green-600 text-white"
                    >
                      Auto Refresh
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-4 overflow-auto">
                <div
                  className="text-sm"
                  style={{ color: themeColors.textSecondary }}
                >
                  Preview output will appear here...
                </div>

                {/* Console Errors */}
                {currentSettings.showConsoleErrors && (
                  <div
                    className="mt-4 p-3 rounded text-sm"
                    style={{
                      backgroundColor: themeColors.bg,
                      borderLeft: '3px solid #ef4444'
                    }}
                  >
                    <div className="font-semibold text-red-500 mb-1">Console</div>
                    <div style={{ color: themeColors.textSecondary }}>
                      No errors
                    </div>
                  </div>
                )}
              </div>
              <ConsolePanel
                logs={logs}
                builderLogs={builderLogs}
                onClearLogs={() => setLogs([])}
                onClearBuilderLogs={() => setBuilderLogs([])}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialSettings={currentSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}