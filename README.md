# Dijon Miller

**LiveDocs** is a real-time collaborative document editor that allows multiple users to edit the same document simultaneously, without fear of losing progress by efficiently storing document versions.

[Project Plan Doc](https://docs.google.com/document/d/1wUI-vD8mm0Y700sXINE6CuCBmlKH4UZyLtcXPW9E1eI/edit?tab=t.0) 
[Hosted Version](live-docs-nhzm313l4-dijons-projects-a3f60b1b.vercel.app/)


## MVP Features

- **Authentication**: Google OAuth 2 integration for secure login.
- **Custom UI Animation**: Version Control Carousel with animated scrolling of version history.
- **Unique Cursor Interaction**: Each user has a unique color; live cursors are visible with real-time updates and hover info displays the user’s profile.
- **Multiple Views**: 
  - Login Page  
  - Home Page (lists your and shared documents)  
  - Document Page (rich-text editor)  
  - Group Permission Management Page
- **Loading States**:
  - After login
  - Modals (Share / Version History)
  - Auto-save indicator
- **API Integration**: Uses **Gemini API** to generate real-time document summaries.



## Stretch Features

- **Rename Documents**: 
  - Option 1: Through 3-dot menu on document cards  
  - Option 2: Inline editing from the document page
- **Search Documents**: Search bar filters your documents based on title or keywords.



## TC1 - Real-Time Collaboration

- **WebSocket Server**:  
  Built from scratch without any libraries (e.g., no Socket.IO). Handles upgrade, handshake, broadcast, room management.
- **User Presence**:  
  Displays real-time collaborators.
- **Live Cursors**:  
  Other users’ cursors appear live with their assigned color. Hovering avatars shows user info.
- **Document Permissions**:  
  Share documents with 3 roles:  
  - Viewer (read-only)  
  - Editor (can type)  
  - Admin (can manage collaborators)
- **Notifications**:  
  - **Real-Time**: In-app notification if the invited user is online.  
  - **Email**: Email invite sent with document link and role.



## TC2 - Patch-Based Version Control

- **Custom Delta Engine**:  
  Mirrors Quill.js’s behavior via a hand-rolled OT-style delta engine.
- **Preview Versions**:  
  View historical versions via a version carousel and modal interface.
- **Auto Save**:  
  Debounced patch saving on user input.
- **Revert to Previous Versions**:  
  Restore the document to a previous version in one click.
- **Version Reconstruction**:  
  Each patch contains a cumulative delta snapshot of the entire document history up to that point.
- **Efficient Version Storage**:  
  Only diffs are saved unless a full snapshot is flagged, reducing database size.



## TC3 - Auto Complete System

- **Trie Tree**:  
  Fast prefix lookup using a tree-based autocomplete structure.
- **Fuzzy Search**:  
  Levenshtein Distance-based ranking for mistyped or partial entries.
- **ML-Based Contextual Ranking**:  
  Suggestions are ranked based on surrounding words.
- **Smart Insertion Logic**:  
  Reaplces only the intended word fragment at the cursor without disrupting surrounding text.
- **Keyboard Navigation**:  
  Tab and arrow keys for suggestion navigation with smooth UI integration.

