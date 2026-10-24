# backseat

A fake Twitch chat for Claude Code. As Claude reads files, runs commands and finishes turns, a made-up chat reacts: viewers hype, tease and spam emotes, and a moderator now and then pretends to time someone out.

It draws the last three lines above the prompt, and a fuller chat in a side pane.

## Install

```
/plugin marketplace add anunstayblemind/claude-mods
/plugin install backseat@claude-mods
```


Needs a Claude Code version that supports mods (2.1.287 or later).

## Use

- The **Chat: on/off** button above the prompt switches it.
- **Side chat** opens the pane; `/backseat` does the same.
- **Clear chat** empties the pane.

## What it costs

Each reaction is one small Haiku request on your own Claude subscription. It fires at most once every 12 seconds and stops after 80 requests per session. Turn the chat off and it makes none.

## What it sees

It reads a one-line summary of each tool call (the tool, the file name without its folder, the first 70 characters of a command) and the first 100 characters of your prompts, and sends them to the model to write the chat. Turn it off if you don't want that.

## Make it yours

`hooks/persona.ts` holds the moderator's name and the instructions the model follows. Change them to change who talks and how.

## Limits

- Terminal only. It was tested on Windows.
- The chat is made up by a model and can be wrong or silly. It is for fun.

## License

MIT. See [LICENSE](LICENSE).
