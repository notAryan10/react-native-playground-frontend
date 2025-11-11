import { FileNode } from '../components/FileExplorer';

export const generateReactNativeTemplate = (): FileNode[] => {
  return [
    {
      id: 'index-js',
      name: 'index.js',
      type: 'file',
      path: '/index.js',
      content: `import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root')
});
`,
    },
    {
      id: 'app-jsx',
      name: 'App.jsx',
      type: 'file',
      path: '/App.jsx',
      content: `import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([
    { id: '1', title: 'Welcome', content: 'This is your first note!' }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: 'Start writing...',
    };
    setNotes([...notes, newNote]);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (editingId) {
      setNotes(notes.map(note =>
        note.id === editingId
          ? { ...note, title: editTitle, content: editContent }
          : note
      ));
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Notes</Text>
        <Pressable style={styles.createButton} onPress={createNote}>
          <Text style={styles.createButtonText}>+ New Note</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.notesList}>
        {notes.map(note => (
          <View key={note.id} style={styles.noteCard}>
            {editingId === note.id ? (
              <View style={styles.editForm}>
                <TextInput
                  style={styles.editInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Title"
                />
                <TextInput
                  style={[styles.editInput, styles.contentInput]}
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="Content"
                  multiline
                />
                <View style={styles.editButtons}>
                  <Pressable style={styles.saveButton} onPress={saveEdit}>
                    <Text style={styles.buttonText}>Save</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={cancelEdit}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteContent}>{note.content}</Text>
                <View style={styles.noteActions}>
                  <Pressable
                    style={styles.editButton}
                    onPress={() => startEdit(note)}
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteNote(note.id)}
                  >
                    <Text style={styles.actionText}>Delete</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  notesList: {
    flex: 1,
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  editForm: {
    gap: 12,
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  contentInput: {
    minHeight: 80,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});`,
    },
    {
      id: 'package-json',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: `{
  "name": "react-native-playground",
  "version": "0.1.0",
  "main": "index.js",
  "scripts": {
    "web": "webpack serve",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native": "^0.72.0",
    "react-native-web": "^0.19.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-react": "^7.18.0",
    "babel-loader": "^9.0.0",
    "webpack": "^5.75.0",
    "webpack-cli": "^5.0.0",
    "webpack-dev-server": "^4.11.0"
  }
}`,
    },
    {
      id: 'webpack-config',
      name: 'webpack.config.js',
      type: 'file',
      path: '/webpack.config.js',
      content: `const path = require('path');

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  devServer: {
    port: 8080,
    hot: true,
  },
};
`,
    },
    {
      id: 'babel-config',
      name: '.babelrc',
      type: 'file',
      path: '/.babelrc',
      content: `{
  "presets": ["@babel/preset-react"]
}
`,
    },
    {
      id: 'readme-md',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: `# React Native Web Playground

A simple notes app demonstrating Create, Read, Update, and Delete (CRUD) operations.

## Features

- Create new notes
- Edit existing notes
- Delete notes
- Clean, modern UI
- Runs in the browser with React Native Web

## Running the App

\`\`\`bash
npm install
npm run web
\`\`\`

Open http://localhost:8080 in your browser.
`,
    },
    {
      id: 'src-folder',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: 'components-folder',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          children: [
            {
              id: 'note-item',
              name: 'NoteItem.tsx',
              type: 'file',
              path: '/src/components/NoteItem.tsx',
              content: `import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface NoteItemProps {
  id: string;
  title: string;
  content: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  title,
  content,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.editButton} onPress={onEdit}>
          <Text style={styles.buttonText}>Edit</Text>
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
`,
            },
          ],
        },
      ],
    },
  ];
};

export const emptyProject = (): FileNode[] => {
  return [
    {
      id: 'index-js',
      name: 'index.js',
      type: 'file',
      path: '/index.js',
      content: `import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root')
});
`,
    },
    {
      id: 'app-jsx',
      name: 'App.jsx',
      type: 'file',
      path: '/App.jsx',
      content: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello React Native Web!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
`,
    },
    {
      id: 'package-json',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      content: `{
  "name": "react-native-playground",
  "version": "0.1.0",
  "main": "index.js",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-native-web": "^0.19.0"
  }
}`,
    },
  ];
};
