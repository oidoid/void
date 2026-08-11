interface FileSystemHandle {
  queryPermission(descriptor?: {
    mode?: 'read' | 'readwrite'
  }): Promise<PermissionState>
  requestPermission(descriptor?: {
    mode?: 'read' | 'readwrite'
  }): Promise<PermissionState>
}

type ShowOpenFilePickerOptions = {
  excludeAcceptAllOption?: boolean
  id?: string
  multiple?: boolean
  startIn?:
    | FileSystemHandle
    | 'desktop'
    | 'documents'
    | 'downloads'
    | 'music'
    | 'pictures'
    | 'videos'
  types?: {desc?: string; accept: {[mime: string]: string[]}}[]
}

function showOpenFilePicker(
  opts?: ShowOpenFilePickerOptions
): Promise<FileSystemFileHandle[]>
