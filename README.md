# Wiki-Bot
**Wiki-Bot** is a bot for [Discord](https://discord.com/) with the purpose to easily link to [Gamepedia](https://www.gamepedia.com/) and [Fandom](https://www.fandom.com/) wikis.
<br>He resolves redirects and follows interwiki links.
<br>**Wiki-Bot** has translations for English, German, French, Dutch, Polish, Portuguese, Russian, Turkish and Chinese.

**Wiki-Bot is not affiliated with Fandom and is an unofficial tool!**

[Use this link to invite **Wiki-Bot** to your Discord server.](https://discord.com/oauth2/authorize?client_id=461189216198590464&permissions=403033152&scope=bot)

Support server: [https://discord.gg/v77RTk5](https://discord.gg/v77RTk5)

#### Table of Contents
* [Commands](#commands)
  * [Admin](#admin)
* [User Verification](#user-verification)
* [Voice Channel](#voice-channel)

## Commands
For a full list with all commands use `!wiki help`

| Command | Description |
| ------- | ----------- |
| `!wiki <search term>` | **Wiki-Bot** will answer with a link to a matching article in the wiki. |
| `!wiki !<wiki> <search term>` | **Wiki-Bot** will answer with a link to a matching article in the named Gamepedia wiki: `https://<wiki>.gamepedia.com/` |
| `!wiki ?<wiki> <search term>` | **Wiki-Bot** will answer with a link to a matching article in the named Fandom wiki: `https://<wiki>.fandom.com/` |
| `!wiki ??<wiki> <search term>` | **Wiki-Bot** will answer with a link to a matching article in the named Wikia wiki: `https://<wiki>.wikia.org/` |
| `!wiki User:<username>` | **Wiki-Bot** will show some information about the user. |
| `!wiki diff <diff> [<oldid>]` | **Wiki-Bot** will answer with a link to the diff in the wiki. |
| `!wiki diff <page name>` | **Wiki-Bot** will answer with a link to the last diff on the article in the wiki. |
| `!wiki random` | **Wiki-Bot** will answer with a link to a random page in the wiki. |
| `!wiki overview` | **Wiki-Bot** will show some information and statistics about the wiki. |
| `!wiki discussion <search term>` | **Wiki-Bot** will answer with a link to a matching discussion thread in the Fandom wiki. |
| `!wiki discussion post <search term>` | **Wiki-Bot** will answer with a link to a matching discussion post in the Fandom wiki. |
| `!wiki info` | **Wiki-Bot** will introduce himself. |
| `!wiki help` | **Wiki-Bot** will list all the commands that he understands. |
| `!wiki help <bot command>` | **Wiki-Bot** will explain the command. |
| `!wiki help admin` | **Wiki-Bot** will list all administrator commands. |
| `!wiki test` | If **Wiki-Bot** is active, he will answer! Otherwise not. |

If you got an unwanted response, you can react with 🗑️ to his message and **Wiki-Bot** will delete it.

### Admin
For a full list with all administrator commands use `!wiki help admin`

| Command | Description |
| ------- | ----------- |
| `!wiki help admin` | **Wiki-Bot** will list all administrator commands. |
| `!wiki settings` | **Wiki-Bot** will change the settings for the server. |
| `!wiki settings lang <language>` | **Wiki-Bot** will change the language for the server. |
| `!wiki settings wiki <wiki>` | **Wiki-Bot** will change the default wiki for the server. |
| `!wiki settings channel` | **Wiki-Bot** will change the channel overwrites for the current channel. |
| `!wiki verification` | **Wiki-Bot** will change the wiki verifications used by the `!wiki verify` command. |
| `!wiki verification add <role>` | **Wiki-Bot** will add a new wiki verification. Accepts a `\|` separated list. |
| `!wiki verification <id> channel <new channel>` | **Wiki-Bot** will change the channel for the wiki verification. Accepts a `\|` separated list. |
| `!wiki verification <id> role <new role>` | **Wiki-Bot** will change the role for the wiki verification. Accepts a `\|` separated list. |
| `!wiki verification <id> editcount <new edit count>` | **Wiki-Bot** will change the minimal edit count for the wiki verification. |
| `!wiki verification <id> usergroup <new user group>` | **Wiki-Bot** will change the user group for the wiki verification. Accepts a `\|` separated list.<br>• Provide `AND` as the first list entry to make all provided user groups required. |
| `!wiki verification <id> accountage <new account age>` | **Wiki-Bot** will change the minimal account age (in days) for the wiki verification. |
| `!wiki verification <id> rename` | **Wiki-Bot** will change if the users Discord nickname should be changed to their wiki username for the wiki verification. |
| `!wiki voice` | **Wiki-Bot** will try to give everyone in a voice channel a specific role. |
| `!wiki pause @Wiki-Bot` | **Wiki-Bot** will ignore all commands on this server, except a few admin commands. |

## User Verification
Using the `!wiki verify <wiki username>` command, users are able to verify themselves as a specific wiki user by using the Discord field on their wiki profile. If the user matches and user verifications are set up on the server, **Wiki-Bot** will give them the roles for all verification entries they matched.

Using the `!wiki verification` command, admins can add up to 10 verification entries on a server. Every verification entry allows for multiple restrictions on when a user should match the verification.
* Channel to use the `!wiki verify` command in.
* Role to get when matching the verification entry.
* Required edit count on the wiki to match the verification entry.
* Required user group to be a member of on the wiki to match the verification entry.
* Required account age in days to match the verification entry.
* Whether the Discord users nickname should be set to their wiki username when they match the verification entry.

See the [admin commands](#admin) or `!wiki help verification` on how to change the wiki verification entries on the server.

## Voice Channel
**Wiki-Bot** is able to give everyone in a voice channel a specific role. This allows for the creation of channels only visible or writable when in a specific voice channel.
<br>Use `!wiki voice` to get the format for the role name.

## Bot Lists
[![Wiki-Bot](https://botsfordiscord.com/api/bot/461189216198590464/widget)](https://botsfordiscord.com/bot/461189216198590464)
[![Wiki-Bot](https://discord.boats/api/widget/461189216198590464)](https://discord.boats/bot/461189216198590464)
[![Wiki-Bot](https://top.gg/api/widget/461189216198590464.svg)](https://top.gg/bot/461189216198590464)

[Privacy Policy](privacy.md)