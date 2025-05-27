# The Notes — Firefox Extension

**The Notes** is a convenient sidebar extension for Firefox that allows you to create, edit, and format notes.  
Its interface is inspired by Word-like editors and supports rich text styling, lists, code blocks, and LaTeX formulas.

## Features

- Unlimited number of notes
- Rich text formatting:
  - **Bold**, _italic_, __underline__, ~~strikethrough~~
  - • Bullet lists
  - `Code blocks`
  - Links
  - LaTeX formula support (rendered with MathJax)
- Light/Dark theme toggle
- Drag & Drop to reorder notes
- Mark notes as important 
- Edit and delete existing notes

## Installation (Temporary)

1. Open `about:debugging` in Firefox
2. Select **This Firefox** → click **Load Temporary Add-on**
3. Select the `manifest.json` file in the project folder

> Note: this is a temporary installation. It will be removed after restarting Firefox.

## Example

![Example](/screenshots/1.png)  
![Example](/screenshots/2.png)

## TODO

- [ ] Support for `Ctrl+B`, `Ctrl+I`, `Ctrl+U` keyboard shortcuts
- [ ] Export notes as `.md`, `.html`, `.json`
- [ ] Import notes from file
- [ ] Tag system and tag filtering
- [ ] Search in titles and content
- [ ] Create note from selected text on a web page (via context menu)
- [ ] Pin important notes to top
- [ ] Reminder support (via Web Notifications API)
- [ ] Autosave while typing
- [ ] Sync using Firefox Sync API
- [ ] Support for multiple sidebars
- [ ] Cloud sync (GitHub Gist, WebDAV, etc.)
- [ ] Statistics: word count, edit dates, etc.

---

Created with care by **brick1ng5654**
