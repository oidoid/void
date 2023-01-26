import { Button } from '@/void'

/**
 * A partial mapping from keyboard event key string to logical button. Multiple
 * keys can map to the same logical button.
 */
export interface KeyboardMap {
  [key: string]: Button
}
