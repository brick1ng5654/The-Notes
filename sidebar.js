// noteContentInput.addEventListener("input", () => autoResizeTextarea(noteContentInput));


// --- UI ELEMENTS ---
const notesListView = document.getElementById("notesListView");
const noteEditorView = document.getElementById("noteEditorView");
const noteList = document.getElementById("noteList");
const createNoteBtn = document.getElementById("createNote");
const saveNoteBtn = document.getElementById("saveNote");
const cancelEditBtn = document.getElementById("cancelEdit");
const noteTitleInput = document.getElementById("noteTitle");
const noteContentInput = document.getElementById("noteContent");
const editorTitle = document.getElementById("editorTitle");

let editingNoteId = null;
let isDialogOpen = false;

// --- VIEW SWITCHING ---
function switchView(showEditor) {
  if (showEditor) {
    notesListView.style.display = "none";
    noteEditorView.style.display = "block";
  } else {
    notesListView.style.display = "block";
    noteEditorView.style.display = "none";
    noteTitleInput.value = "";
    noteContentInput.innerHTML = "";
    editingNoteId = null;
  }
}

// --- NOTES LOADING ---
async function loadNotes() {
  const { notes = [] } = await browser.storage.local.get("notes");
  renderNotes(notes);
}

// --- NOTES RENDERING ---
function renderNotes(notes) {
  noteList.innerHTML = "";

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.dataset.index = index;

    const titleSpan = document.createElement("span");
    let titleText = note.title;
    if (note.important) titleText = `⭐ ${titleText}`;
    if (note.reminder) {
      const reminderDate = new Date(note.reminder);
      const formattedDate = reminderDate.toLocaleString();
      titleText = `⏰ ${titleText} (${formattedDate})`;
    }
    titleSpan.textContent = titleText;
    titleSpan.style.flex = "1";
    titleSpan.style.marginRight = "10px";
    titleSpan.style.cursor = "pointer";
    titleSpan.onclick = () => openNoteEditor(note);

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "10px";
    btnGroup.style.padding = "4px 8px";
    btnGroup.style.borderRadius = "8px";
    btnGroup.style.alignItems = "center";

    // importance button
    const importantBtn = document.createElement("button");
    importantBtn.innerHTML = '<img src="icons/star.svg" width="22" height="22">';
    importantBtn.title = "Important";
    importantBtn.style.background = "transparent";
    importantBtn.style.border = "none";
    importantBtn.style.cursor = "pointer";
    importantBtn.style.marginTop = "18px";
    importantBtn.onclick = async (e) => {
        e.stopPropagation();
        note.important = !note.important;
        notes[index] = note;
        await browser.storage.local.set({ notes });
        renderNotes(notes);
    };

    // reminder button
    const reminderBtn = document.createElement("button");
    reminderBtn.innerHTML = '<img src="icons/alarm.svg" width="22" height="22">';
    reminderBtn.title = note.reminder ? "Remove Reminder" : "Set Reminder";
    reminderBtn.style.background = "transparent";
    reminderBtn.style.border = "none";
    reminderBtn.style.cursor = "pointer";
    reminderBtn.style.marginTop = "18px";
    if (note.reminder) {
        reminderBtn.style.opacity = "1";
    }
    reminderBtn.onclick = async (e) => {
        e.stopPropagation();
        if (note.reminder) {
            // Удаляем напоминание
            delete note.reminder;
            notes[index] = note;
            await browser.storage.local.set({ notes });
            renderNotes(notes);
        } else {
            // Устанавливаем новое напоминание
            const reminderTime = prompt("Enter reminder time (YYYY-MM-DD HH:mm):");
            if (reminderTime) {
                note.reminder = reminderTime;
                notes[index] = note;
                await browser.storage.local.set({ notes });
                renderNotes(notes);
            }
        }
    };

    // delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<img src="icons/trash.svg" width="22" height="22">';
    deleteBtn.title = "Delete";
    deleteBtn.style.background = "transparent";
    deleteBtn.style.border = "none";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.marginTop = "18px";
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm("Delete note?")) {
            notes.splice(index, 1);
            await browser.storage.local.set({ notes });
            renderNotes(notes);
        }
    };

    btnGroup.appendChild(importantBtn);
    btnGroup.appendChild(reminderBtn);
    btnGroup.appendChild(deleteBtn);

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.width = "100%";

    wrapper.appendChild(titleSpan);
    wrapper.appendChild(btnGroup);
    li.appendChild(wrapper);

    // drag and drop handlers
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index.toString());
      li.style.opacity = "0.5";
    });

    li.addEventListener("dragend", () => {
      li.style.opacity = "1";
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.style.borderTop = "2px solid #007bff";
    });

    li.addEventListener("dragleave", () => {
      li.style.borderTop = "none";
    });

    li.addEventListener("drop", async (e) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const targetIndex = parseInt(li.dataset.index);

      if (draggedIndex !== targetIndex) {
        const draggedItem = notes[draggedIndex];
        notes.splice(draggedIndex, 1);
        notes.splice(targetIndex, 0, draggedItem);

        await browser.storage.local.set({ notes });
        renderNotes(notes);
      }
    });

    noteList.appendChild(li);
  });

  if (window.createIcons) {
    window.createIcons({ icons: window.lucideIcons });
  }
}

// --- NOTE EDITOR ---
function openNoteEditor(note) {
  noteTitleInput.value = note.title;
  noteContentInput.innerHTML = note.content;
  editorTitle.textContent = "Edit";
  editingNoteId = note.id;
  switchView(true);
  initFormatting();
}

// --- BUTTON HANDLERS ---
createNoteBtn.addEventListener("click", () => {
  editorTitle.textContent = "New Note";
  noteTitleInput.value = "";
  noteContentInput.innerHTML = "";
  editingNoteId = null;
  switchView(true);
  initFormatting();
});

cancelEditBtn.addEventListener("click", () => {
  switchView(false);
});

saveNoteBtn.addEventListener("click", async () => {
  const title = noteTitleInput.value.trim();
  const content = noteContentInput.innerHTML.trim();
  if (!title && !content) return;

  const { notes = [] } = await browser.storage.local.get("notes");

  let updatedNotes;
  if (editingNoteId) {
    updatedNotes = notes.map(note =>
      note.id === editingNoteId ? { ...note, title, content } : note
    );
  } else {
    const newNote = { id: Date.now(), title, content, important: false };
    updatedNotes = [...notes, newNote];
  }

  await browser.storage.local.set({ notes: updatedNotes });
  switchView(false);
  renderNotes(updatedNotes);
  if (window.createIcons) {
    window.createIcons({ icons: window.lucideIcons });
  }
});

// --- FORMATTING FUNCTIONS ---
function updateMathJax() {
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

function createLatexFormula() {
    if (isDialogOpen) return;
    
    isDialogOpen = true;
    const latexText = prompt('Enter LaTeX formula (e.g., E = mc^2 or x^2 + y^2 = z^2):');
    isDialogOpen = false;
    
    if (latexText) {
        const latexBlock = `<span class="latex" data-latex="${latexText}">\\[${latexText}\\]</span>`;
        document.execCommand('insertHTML', false, latexBlock);
        updateMathJax();
    }
}

function editLatexFormula(element) {
    if (isDialogOpen) return;
    
    isDialogOpen = true;
    const currentLatex = element.getAttribute('data-latex');
    const newLatex = prompt('Edit formula:', currentLatex);
    isDialogOpen = false;
    
    if (newLatex && newLatex !== currentLatex) {
        element.setAttribute('data-latex', newLatex);
        element.innerHTML = `\\[${newLatex}\\]`;
        updateMathJax();
    }
}

function initFormatting() {
    const formatButtons = document.querySelectorAll('.format-btn');
    const noteContent = document.getElementById('noteContent');

    // latex formula click handler
    noteContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('latex')) {
            editLatexFormula(e.target);
        }
    });

    // code block keyboard handlers
    noteContent.addEventListener('keydown', (e) => {
        const selection = window.getSelection();
        const codeBlock = selection.anchorNode.parentElement.closest('.code-block');
        
        if (codeBlock) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    // shift+enter: new line inside code block
                    document.execCommand('insertHTML', false, '<br>');
                } else {
                    // enter: exit code block and create new line without formatting
                    const range = document.createRange();
                    const newLine = document.createElement('div');
                    newLine.innerHTML = '<br>';
                    
                    // remove all formatting from new line
                    document.execCommand('removeFormat', false, null);
                    document.execCommand('unlink', false, null);
                    document.execCommand('outdent', false, null);
                    
                    // insert new line after code block
                    codeBlock.after(newLine);
                    
                    // set cursor to new line
                    range.setStartAfter(newLine);
                    range.setEndAfter(newLine);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
    });

    // Remove any existing event listeners
    formatButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    // Add new event listeners
    document.querySelectorAll('.format-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (isDialogOpen) return;

            const format = button.dataset.format;
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            // check if we're inside a code block
            const isInCodeBlock = selection.anchorNode.parentElement.closest('.code-block');
            
            // if in code block, only allow clear formatting
            if (isInCodeBlock && format !== 'clear') {
                return;
            }
            
            switch(format) {
                case 'bold':
                    document.execCommand('bold', false, null);
                    break;
                case 'italic':
                    document.execCommand('italic', false, null);
                    break;
                case 'underline':
                    document.execCommand('underline', false, null);
                    break;
                case 'strikethrough':
                    document.execCommand('strikethrough', false, null);
                    break;
                case 'bullet':
                    document.execCommand('insertUnorderedList', false, null);
                    break;
                case 'clear':
                    // remove all formatting
                    document.execCommand('removeFormat', false, null);
                    document.execCommand('unlink', false, null);
                    document.execCommand('outdent', false, null);
                    
                    // remove latex formulas
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const container = range.commonAncestorContainer;
                        const latexElements = container.parentElement.querySelectorAll('.latex');
                        latexElements.forEach(el => {
                            el.outerHTML = el.getAttribute('data-latex') || '';
                        });
                    }
                    
                    // remove code blocks
                    const codeBlocks = noteContent.querySelectorAll('.code-block');
                    codeBlocks.forEach(block => {
                        block.outerHTML = block.textContent;
                    });
                    break;
                case 'code':
                    if (selectedText) {
                        // wrap selected text in code block
                        const codeBlock = `<div class="code-block">${selectedText}</div>`;
                        document.execCommand('insertHTML', false, codeBlock);
                    } else {
                        // create empty code block
                        const codeBlock = `<div class="code-block"><br></div>`;
                        document.execCommand('insertHTML', false, codeBlock);
                        
                        // set cursor inside block
                        const newBlock = noteContent.querySelector('.code-block:last-child');
                        if (newBlock) {
                            const range = document.createRange();
                            range.setStart(newBlock, 0);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                    break;
                case 'latex':
                    createLatexFormula();
                    break;
                case 'link':
                    if (isDialogOpen) return;
                    isDialogOpen = true;
                    const url = prompt('Enter URL:', 'https://');
                    isDialogOpen = false;
                    
                    if (url) {
                        if (selectedText) {
                            document.execCommand('createLink', false, url);
                        } else {
                            document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${url}</a>`);
                        }
                    }
                    break;
            }
            
            // update button states
            updateFormatButtons();
        });
    });

    // update format buttons state
    function updateFormatButtons() {
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(button => {
            const format = button.dataset.format;
            if (format === 'bold' || format === 'italic' || format === 'underline' || format === 'strikethrough') {
                if (document.queryCommandState(format)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    noteContent.addEventListener('keyup', updateFormatButtons);
    noteContent.addEventListener('mouseup', updateFormatButtons);
    noteContent.addEventListener('input', updateFormatButtons);
}

// --- NOTIFICATIONS ---
async function checkReminders() {
    const { notes = [] } = await browser.storage.local.get("notes");
    const now = new Date();
    
    notes.forEach(note => {
        if (note.reminder) {
            const reminderTime = new Date(note.reminder);
            const timeDiff = reminderTime - now;
            
            // Если время напоминания наступило (с погрешностью в 1 минуту)
            if (timeDiff > 0 && timeDiff <= 60000) {
                browser.notifications.create({
                    type: "basic",
                    iconUrl: "icons/alarm.svg",
                    title: "Note Reminder",
                    message: note.title
                }).catch(error => {
                    console.error("Failed to create notification:", error);
                });
            }
        }
    });
}

// Запускаем проверку напоминаний каждую минуту
setInterval(checkReminders, 60000);

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    initFormatting();
    checkReminders();
});

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto"; // сброс
  textarea.style.height = (textarea.scrollHeight + 2) + "px";
}