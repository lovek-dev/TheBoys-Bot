/**
 * Shared in-memory tracker for anti-nuke events.
 * Stored as a singleton Map so all anti-nuke event files share the same state.
 */
module.exports = new Map();
