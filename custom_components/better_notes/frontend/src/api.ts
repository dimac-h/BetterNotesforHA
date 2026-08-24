import type { HomeAssistant } from './ha-types';

export interface Note {
  note_id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created: string;
  modified: string;
  tags: string[];
}

export async function getNotes(hass: HomeAssistant): Promise<Note[]> {
  const result = await hass.connection.sendMessagePromise<{ response: { notes: Note[] } }>({
    type: 'call_service',
    domain: 'better_notes',
    service: 'get_notes',
    service_data: {},
    return_response: true,
  });
  return result.response?.notes ?? [];
}

export async function createNote(
  hass: HomeAssistant,
  params: { title: string; content: string; color: string; pinned: boolean },
): Promise<string | undefined> {
  const result = await hass.connection.sendMessagePromise<{ response: { note_id: string } }>({
    type: 'call_service',
    domain: 'better_notes',
    service: 'create_note',
    service_data: params,
    return_response: true,
  });
  return result.response?.note_id;
}

export async function updateNote(
  hass: HomeAssistant,
  params: { note_id: string; title?: string; content?: string; color?: string; pinned?: boolean },
): Promise<void> {
  await hass.callService('better_notes', 'update_note', params);
}

export async function deleteNote(hass: HomeAssistant, noteId: string): Promise<void> {
  await hass.callService('better_notes', 'delete_note', { note_id: noteId });
}

export function subscribeNoteEvents(hass: HomeAssistant, onEvent: () => void): Promise<() => void> {
  const events = ['better_notes_note_created', 'better_notes_note_updated', 'better_notes_note_deleted'];
  return Promise.all(events.map(e => hass.connection.subscribeEvents(onEvent, e))).then(
    unsubs => () => unsubs.forEach(fn => fn()),
  );
}
