// Adding a new Tiptap extension: `npm install @tiptap/extension-X` in
// frontend/, then add it to the Promise.all below and to the returned
// extensions array. That's the whole surface area — tiptap-editor.ts
// never needs to change for a new extension.
export async function loadTiptapExtensions() {
  const [{ Editor }, { StarterKit }, { TaskList }, { TaskItem }, { Link }, { Highlight }, { ListItem }] = await Promise.all([
    import('@tiptap/core'),
    import('@tiptap/starter-kit'),
    import('@tiptap/extension-task-list'),
    import('@tiptap/extension-task-item'),
    import('@tiptap/extension-link'),
    import('@tiptap/extension-highlight'),
    import('@tiptap/extension-list-item'),
  ]);
  return {
    Editor,
    extensions: [
      // listItem: false — replaced below with a ListItem that also allows a
      // heading as its first child. The default ListItem content model is
      // 'paragraph block*' (first child must specifically be a paragraph),
      // so toggling a list item to a heading is invalid at that level and
      // ProseMirror climbs up through every ancestor list to find a place
      // it IS valid, collapsing all nested indentation in the process.
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, listItem: false }),
      ListItem.extend({ content: '(paragraph|heading) block*' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: true }),
      Highlight,
    ],
  };
}
