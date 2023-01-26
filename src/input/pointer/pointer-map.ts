import { Button } from '@/void'

/**
 * A partial mapping from pointer event button to logical button. Multiple
 * pointer buttons can map to the same logical button.
 */
export interface PointerMap {
  [pointerButton: number]: Button
}
