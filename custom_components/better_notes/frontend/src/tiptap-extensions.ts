// Adding a new Tiptap extension: `npm install @tiptap/extension-X` in
// frontend/, then add it to the Promise.all below and to the returned
// extensions array. That's the whole surface area — tiptap-editor.ts
// never needs to change for a new extension.
export async function loadTiptapExtensions() {
  const [{ Editor }, { StarterKit }, { TaskList }, { TaskItem }, { Link }, { Highlight }] = await Promise.all([
    import('@tiptap/core'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-task-list'),
    import('@tiptap/extension-task-item'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-highlight'),
  ]);
  return {
    Editor,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Highlight,
    ],
  };
}
