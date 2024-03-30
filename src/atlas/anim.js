/**
 * @template {AnimTag} T
 * @typedef {object} Anim
 * @prop {readonly Readonly<import('../types/2d.js').XY>[]} cels
 * @prop {Readonly<import('../types/2d.js').Box>} hitbox
 * @prop {number} id A multiple of 16 (maxAnimCels).
 * @prop {number} w
 * @prop {number} h
 * @prop {T & AnimTag} tag
 */

/**
 * `--tagname-format={title}--{tag}`.
 * @typedef {`${string}--${string}`} AnimTag
 */

export const maxAnimCels = 16
