const {limit: {rcgcdw: rcgcdwLimit}, defaultSettings, wikiProjects} = require('../util/default.json');
const allLangs = require('../util/i18n.js').allLangs(true);
var db = require('../util/database.js');

const fs = require('fs');
const rcscriptExists = fs.existsSync('./rcgcdb');

var allSites = [];
const getAllSites = require('../util/allSites.js');
getAllSites.then( sites => allSites = sites );

const display_types = [
	'compact',
	'embed',
	'image',
	'diff'
];

/**
 * Processes the "rcscript" command.
 * @param {import('../util/i18n.js')} lang - The user language.
 * @param {import('discord.js').Message} msg - The Discord message.
 * @param {String[]} args - The command arguments.
 * @param {String} line - The command as plain text.
 * @param {String} wiki - The wiki for the message.
 */
function cmd_rcscript(lang, msg, args, line, wiki) {
	if ( !msg.isAdmin() ) return msg.reactEmoji('❌');
	// Patreon only during testing
	if ( !( msg.guild.id in patreons ) ) {
		return msg.replyMsg( lang.get('general.patreon') + '\n<' + process.env.patreon + '>', {}, true );
	}
	// Patreon only during testing
	if ( !msg.channel.permissionsFor(msg.client.user).has('MANAGE_WEBHOOKS') ) {
		console.log( msg.guild.id + ': Missing permissions - MANAGE_WEBHOOKS' );
		return msg.replyMsg( lang.get('general.missingperm') + ' `MANAGE_WEBHOOKS`' );
	}
	
	db.all( 'SELECT configid, webhook, wiki, lang, display, wikiid FROM rcgcdw WHERE guild = ? ORDER BY configid ASC', [msg.guild.id], (dberror, rows) => {
		if ( dberror || !rows ) {
			console.log( '- Error while getting the RcGcDw: ' + dberror );
			msg.reactEmoji('error', true);
			return dberror;
		}

		var prefix = process.env.prefix;
		var limit = rcgcdwLimit.default;
		var display = display_types.slice(0, rcgcdwLimit.display + 1);
		if ( msg.guild.id in patreons ) {
			prefix = patreons[msg.guild.id];
			limit = rcgcdwLimit.patreon;
			display = display_types.slice();
		}

		if ( args[0] === 'add' ) {
			if ( !msg.channel.permissionsFor(msg.member).has('MANAGE_WEBHOOKS') ) {
				return msg.replyMsg( lang.get('rcscript.noadmin') );
			}
			if ( rows.length >= limit ) return msg.replyMsg( lang.get('rcscript.max_entries'), {}, true );

			var wikiinvalid = lang.get('settings.wikiinvalid') + '\n`' + prefix + 'rcscript add ' + lang.get('rcscript.new_wiki') + '`\n' + lang.get('rcscript.help_wiki');
			var wikinew = args.slice(1).join(' ').toLowerCase().trim().replace( /^<\s*(.*?)\s*>$/, '$1' );
			if ( !wikinew ) wikinew = wiki;
			else {
				wikinew = input_to_wiki(wikinew.replace( /^(?:https?:)?\/\//, 'https://' ));
				if ( !wikinew ) return msg.replyMsg( wikiinvalid, {}, true );
			}
			return msg.reactEmoji('⏳', true).then( reaction => got.get( wikinew + 'api.php?action=query&meta=allmessages|siteinfo&ammessages=custom-RcGcDw|recentchanges&amenableparser=true&siprop=general|extensions&titles=Special:RecentChanges&format=json', {
				responseType: 'json'
			} ).then( response => {
				var body = response.body;
				if ( response.statusCode !== 200 || !body?.query?.allmessages || !body?.query?.general || !body?.query?.extensions || !body?.query?.pages?.['-1'] ) {
					console.log( '- ' + response.statusCode + ': Error while testing the wiki: ' + body?.error?.info );
					if ( reaction ) reaction.removeEmoji();
					msg.reactEmoji('nowiki', true);
					return msg.replyMsg( wikiinvalid, {}, true );
				}
				wikinew = body.query.general.server.replace( /^(?:https?:)?\/\//, 'https://' ) + body.query.general.scriptpath + '/';
				if ( body.query.general.generator.replace( /^MediaWiki 1\.(\d\d).*$/, '$1' ) <= 30 ) {
					console.log( '- This wiki is using ' + body.query.general.generator + '.' );
					if ( reaction ) reaction.removeEmoji();
					return msg.replyMsg( lang.get('test.MediaWiki', 'MediaWiki 1.30', body.query.general.generator) + '\nhttps://www.mediawiki.org/wiki/MediaWiki_1.30', {}, true );
				}
				if ( body.query.allmessages[0]['*'] !== msg.guild.id ) {
					if ( reaction ) reaction.removeEmoji();
					return msg.replyMsg( lang.get('rcscript.sysmessage', 'MediaWiki:Custom-RcGcDw', msg.guild.id) + '\n<' + wikinew.toLink('MediaWiki:Custom-RcGcDw', 'action=edit', '', body.query.general) + '>', {}, true );
				}
				if ( wikinew.isFandom() ) return got.get( 'https://community.fandom.com/api/v1/Wikis/ByString?includeDomain=true&limit=10&string=' + body.query.general.servername + body.query.general.scriptpath + '&format=json', {
					responseType: 'json'
				} ).then( wiresponse => {
					var wibody = wiresponse.body;
					if ( wiresponse.statusCode !== 200 || !wibody || wibody.exception || !wibody.items || !wibody.items.length ) {
						console.log( '- ' + wiresponse.statusCode + ': Error while getting the wiki id: ' + wibody?.exception?.details );
						return createWebhook();
					}
					var site = wibody.items.find( site => site.domain === body.query.general.servername + body.query.general.scriptpath );
					if ( site ) return got.get( 'https://services.fandom.com/discussion/' + site.id + '/posts?limit=1&format=json', {
						headers: {
							Accept: 'application/hal+json'
						},
						responseType: 'json'
					} ).then( dsresponse => {
						var dsbody = dsresponse.body;
						if ( dsresponse.statusCode !== 200 || !dsbody || dsbody.title ) {
							if ( dsbody?.title !== 'site doesn\'t exists' ) console.log( '- ' + dsresponse.statusCode + ': Error while checking for discussions: ' + dsbody?.title );
							return createWebhook();
						}
						return createWebhook(parseInt(site.id, 10));
					}, error => {
						console.log( '- Error while checking for discussions: ' + error );
						return createWebhook();
					} );
					console.log( '- No result while getting the wiki id.' );
					return createWebhook();
				}, error => {
					console.log( '- Error while getting the wiki id: ' + error );
					return createWebhook();
				} );
				return createWebhook();

				/**
				 * Creates the webhook.
				 * @param {Number} wikiid - The ID of the wiki.
				 */
				function createWebhook(wikiid = null) {
					msg.channel.createWebhook( ( body.query.allmessages[1]['*'] || 'Recent changes' ), {
						avatar: msg.client.user.displayAvatarURL({format:'png',size:4096}),
						reason: lang.get('rcscript.audit_reason', wikinew)
					} ).then( webhook => {
						console.log( '- Webhook successfully created.' );
						webhook.send( lang.get('rcscript.webhook.created', body.query.general.sitename) + '\n<' + wikinew.toLink(body.query.pages['-1'].title, '', '', body.query.general) + ( wikiid ? '>\n<' + wikinew + 'f' : '' ) + '>' ).catch(log_error);
						var new_configid = 1;
						for ( let i of rows.map( row => row.configid ) ) {
							if ( new_configid === i ) new_configid++;
							else break;
						}
						db.run( 'INSERT INTO rcgcdw(guild, configid, webhook, wiki, lang, display, wikiid) VALUES(?, ?, ?, ?, ?, ?, ?)', [msg.guild.id, new_configid, webhook.id + '/' + webhook.token, wikinew, ( allLangs.map[lang.lang] || defaultSettings.lang ), ( msg.showEmbed() ? 1 : 0 ), wikiid], function (error) {
							if ( error ) {
								console.log( '- Error while adding the RcGcDw: ' + error );
								if ( reaction ) reaction.removeEmoji();
								msg.replyMsg( lang.get('settings.save_failed'), {}, true );
								return error;
							}
							console.log( '- RcGcDw successfully added.' );
							if ( reaction ) reaction.removeEmoji();
							msg.replyMsg( lang.get('rcscript.added') + ' <' + wikinew + '>\n`' + prefix + 'rcscript' + ( rows.length ? ' ' + new_configid : '' ) + '`', {}, true );
						} );
					}, error => {
						console.log( '- Error while creating the webhook: ' + error );
						if ( reaction ) reaction.removeEmoji();
						msg.replyMsg( lang.get('rcscript.webhook_failed'), {}, true );
					} );
				}
			}, error => {
				console.log( '- Error while testing the wiki: ' + error );
				if ( reaction ) reaction.removeEmoji();
				msg.reactEmoji('nowiki', true);
				return msg.replyMsg( wikiinvalid, {}, true );
			} ) );
		}

		var selected_row = rows.find( row => row.configid.toString() === args[0] );
		if ( selected_row ) {
			args[0] = args[1];
			args[1] = args.slice(2).join(' ').toLowerCase().trim().replace( /^<\s*(.*)\s*>$/, '$1' );
		}
		else {
			args[1] = args.slice(1).join(' ').toLowerCase().trim().replace( /^<\s*(.*)\s*>$/, '$1' );
			if ( rows.length === 1 ) selected_row = rows[0];
		}
		if ( args[0] ) args[0] = args[0].toLowerCase();

		if ( selected_row ) {
			let cmd = prefix + 'rcscript' + ( rows.length === 1 ? '' : ' ' + selected_row.configid );

			if ( args[0] === 'delete' && !args[1] ) {
				return msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
					var channel = msg.guild.channels.cache.get(webhook.channelID);
					if ( !channel || !channel.permissionsFor(msg.member).has('MANAGE_WEBHOOKS') ) {
						return msg.replyMsg( lang.get('rcscript.noadmin') );
					}
					webhook.send( lang.get('rcscript.webhook.deleted') ).catch(log_error);
					db.run( 'DELETE FROM rcgcdw WHERE webhook = ?', [selected_row.webhook], function (delerror) {
						if ( delerror ) {
							console.log( '- Error while removing the RcGcDw: ' + delerror );
							msg.replyMsg( lang.get('settings.save_failed'), {}, true );
							return delerror;
						}
						console.log( '- RcGcDw successfully removed.' );
						msg.replyMsg( lang.get('rcscript.deleted'), {}, true );
						webhook.delete(lang.get('rcscript.audit_reason_delete')).catch(log_error);
					} );
				}, error => {
					log_error(error);
					if ( error.toString() !== 'DiscordAPIError: Unknown Webhook' ) {
						return msg.replyMsg( lang.get('settings.save_failed'), {}, true );
					}
					db.run( 'DELETE FROM rcgcdw WHERE webhook = ?', [selected_row.webhook], function (delerror) {
						if ( delerror ) {
							console.log( '- Error while removing the RcGcDw: ' + delerror );
							msg.replyMsg( lang.get('settings.save_failed'), {}, true );
							return delerror;
						}
						console.log( '- RcGcDw successfully removed.' );
						msg.replyMsg( lang.get('rcscript.deleted'), {}, true );
					} );
				} );
			}
			if ( args[0] === 'wiki' ) {
				if ( !args[1] ) {
					return msg.replyMsg( lang.get('rcscript.current_wiki') + ' <' + selected_row.wiki + '>\n`' + cmd + ' wiki ' + lang.get('rcscript.new_wiki') + '`\n' + lang.get('rcscript.help_wiki'), {}, true );
				}

				var wikiinvalid = lang.get('settings.wikiinvalid') + '\n`' + cmd + ' wiki ' + lang.get('rcscript.new_wiki') + '`\n' + lang.get('rcscript.help_wiki');
				var wikinew = input_to_wiki(args[1].replace( /^(?:https?:)?\/\//, 'https://' ));
				if ( !wikinew ) return msg.replyMsg( wikiinvalid, {}, true );
				return msg.reactEmoji('⏳', true).then( reaction => got.get( wikinew + 'api.php?action=query&meta=allmessages|siteinfo&ammessages=custom-RcGcDw&amenableparser=true&siprop=general|extensions&titles=Special:RecentChanges&format=json', {
					responseType: 'json'
				} ).then( response => {
					var body = response.body;
					if ( response.statusCode !== 200 || !body?.query?.allmessages || !body?.query?.general || !body?.query?.extensions || !body?.query?.pages?.['-1'] ) {
						console.log( '- ' + response.statusCode + ': Error while testing the wiki: ' + body?.error?.info );
						if ( reaction ) reaction.removeEmoji();
						msg.reactEmoji('nowiki', true);
						return msg.replyMsg( wikiinvalid, {}, true );
					}
					wikinew = body.query.general.server.replace( /^(?:https?:)?\/\//, 'https://' ) + body.query.general.scriptpath + '/';
					if ( body.query.general.generator.replace( /^MediaWiki 1\.(\d\d).*$/, '$1' ) <= 30 ) {
						console.log( '- This wiki is using ' + body.query.general.generator + '.' );
						if ( reaction ) reaction.removeEmoji();
						return msg.replyMsg( lang.get('test.MediaWiki', 'MediaWiki 1.30', body.query.general.generator) + '\nhttps://www.mediawiki.org/wiki/MediaWiki_1.30', {}, true );
					}
					if ( body.query.allmessages[0]['*'] !== msg.guild.id ) {
						if ( reaction ) reaction.removeEmoji();
						return msg.replyMsg( lang.get('rcscript.sysmessage', 'MediaWiki:Custom-RcGcDw', msg.guild.id) + '\n<' + wikinew.toLink('MediaWiki:Custom-RcGcDw', 'action=edit', '', body.query.general) + '>', {}, true );
					}
					if ( wikinew.isFandom() ) return got.get( 'https://community.fandom.com/api/v1/Wikis/ByString?includeDomain=true&limit=10&string=' + body.query.general.servername + body.query.general.scriptpath + '&format=json', {
						responseType: 'json'
					} ).then( wiresponse => {
						var wibody = wiresponse.body;
						if ( wiresponse.statusCode !== 200 || !wibody || wibody.exception || !wibody.items || !wibody.items.length ) {
							console.log( '- ' + wiresponse.statusCode + ': Error while getting the wiki id: ' + wibody?.exception?.details );
							return updateWiki();
						}
						var site = wibody.items.find( site => site.domain === body.query.general.servername + body.query.general.scriptpath );
						if ( site ) return got.get( 'https://services.fandom.com/discussion/' + site.id + '/posts?limit=1&format=json', {
							headers: {
								Accept: 'application/hal+json'
							},
							responseType: 'json'
						} ).then( dsresponse => {
							var dsbody = dsresponse.body;
							if ( dsresponse.statusCode !== 200 || !dsbody || dsbody.title ) {
								if ( dsbody?.title !== 'site doesn\'t exists' ) console.log( '- ' + dsresponse.statusCode + ': Error while checking for discussions: ' + dsbody?.title );
								return updateWiki();
							}
							return updateWiki(parseInt(site.id, 10));
						}, error => {
							console.log( '- Error while checking for discussions: ' + error );
							return updateWiki();
						} );
						console.log( '- No result while getting the wiki id.' );
						return updateWiki();
					}, error => {
						console.log( '- Error while getting the wiki id: ' + error );
						return updateWiki();
					} );
					return updateWiki();

					/**
					 * Changes the wiki.
					 * @param {Number} wikiid - The ID of the wiki.
					 */
					function updateWiki(wikiid = null) {
						msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
							webhook.send( lang.get('rcscript.webhook.updated_wiki', body.query.general.sitename) + '\n<' + wikinew.toLink(body.query.pages['-1'].title, '', '', body.query.general) + ( wikiid ? '>\n<' + wikinew + 'f' : '' ) + '>' ).catch(log_error);
						}, log_error );
						db.run( 'UPDATE rcgcdw SET wiki = ?, wikiid = ?, rcid = ?, postid = ? WHERE webhook = ?', [wikinew, wikiid, null, null, selected_row.webhook], function (error) {
							if ( error ) {
								console.log( '- Error while updating the RcGcDw: ' + error );
								if ( reaction ) reaction.removeEmoji();
								msg.replyMsg( lang.get('settings.save_failed'), {}, true );
								return error;
							}
							console.log( '- RcGcDw successfully updated.' );
							if ( reaction ) reaction.removeEmoji();
							msg.replyMsg( lang.get('rcscript.updated_wiki') + ' <' + wikinew + '>\n`' + cmd + '`', {}, true );
						} );
					}
				}, error => {
					console.log( '- Error while testing the wiki: ' + error );
					if ( reaction ) reaction.removeEmoji();
					msg.reactEmoji('nowiki', true);
					return msg.replyMsg( wikiinvalid, {}, true );
				} ) );
			}
			if ( args[0] === 'lang' ) {
				if ( !args[1] ) {
					return msg.replyMsg( lang.get('rcscript.current_lang') + ' `' + allLangs.names[selected_row.lang] + '`\n`' + cmd + ' lang ' + lang.get('rcscript.new_lang') + '`\n' + lang.get('rcscript.help_lang') + ' `' + Object.values(allLangs.names).join('`, `') + '`', {}, true );
				}
				if ( !( args[1] in allLangs.map ) ) {
					return msg.replyMsg( lang.get('settings.langinvalid') + '\n`' + cmd + ' lang ' + lang.get('rcscript.new_lang') + '`\n' + lang.get('rcscript.help_lang') + ' `' + Object.values(allLangs.names).join('`, `') + '`', {}, true );
				}

				msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
					webhook.send( lang.get('rcscript.webhook.updated_lang', allLangs.names[allLangs.map[args[1]]]) ).catch(log_error);
				}, log_error );
				return db.run( 'UPDATE rcgcdw SET lang = ? WHERE webhook = ?', [allLangs.map[args[1]], selected_row.webhook], function (error) {
					if ( error ) {
						console.log( '- Error while updating the RcGcDw: ' + error );
						msg.replyMsg( lang.get('settings.save_failed'), {}, true );
						return error;
					}
					console.log( '- RcGcDw successfully updated.' );
					msg.replyMsg( lang.get('rcscript.updated_lang') + ' `' + allLangs.names[allLangs.map[args[1]]] + '`\n`' + cmd + '`', {}, true );
				} );
			}
			if ( args[0] === 'display' ) {
				if ( !args[1] || !display_types.includes( args[1] ) ) {
					return msg.replyMsg( lang.get('rcscript.current_display') + ' `' + display_types[selected_row.display] + '`\n`' + cmd + ' display (' + display.join('|') + ')`\n' + display.map( display_type => '`' + display_type + '`: ' + lang.get('rcscript.help_display_' + display_type) ).join('\n'), {}, true );
				}
				if ( !display.includes( args[1] ) ) {
					return msg.replyMsg( lang.get('general.patreon') + '\n<' + process.env.patreon + '>', {}, true );
				}

				msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
					webhook.send( lang.get('rcscript.webhook.updated_display_' + args[1]) ).catch(log_error);
				}, log_error );
				return db.run( 'UPDATE rcgcdw SET display = ? WHERE webhook = ?', [display_types.indexOf(args[1]), selected_row.webhook], function (error) {
					if ( error ) {
						console.log( '- Error while updating the RcGcDw: ' + error );
						msg.replyMsg( lang.get('settings.save_failed'), {}, true );
						return error;
					}
					console.log( '- RcGcDw successfully updated.' );
					msg.replyMsg( lang.get('rcscript.updated_display') + ' `' + args[1] + '`\n`' + cmd + '`', {}, true );
				} );
			}
			if ( selected_row.wiki.isFandom() && args[0] === 'feeds' ) {
				if ( selected_row.wikiid ) {
					msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
						webhook.send( lang.get('rcscript.webhook.disabled_feeds') ).catch(log_error);
					}, log_error );
					return db.run( 'UPDATE rcgcdw SET wikiid = ?, postid = ? WHERE webhook = ?', [null, null, selected_row.webhook], function (error) {
						if ( error ) {
							console.log( '- Error while updating the RcGcDw: ' + error );
							msg.replyMsg( lang.get('settings.save_failed'), {}, true );
							return error;
						}
						console.log( '- RcGcDw successfully updated.' );
						msg.replyMsg( lang.get('rcscript.disabled_feeds') + '\n`' + cmd + '`', {}, true );
					} );
				}

				let scriptPath = selected_row.wiki.replace( /^https:\/\/(.*)\/$/, '$1' );
				return msg.reactEmoji('⏳', true).then( reaction => got.get( 'https://community.fandom.com/api/v1/Wikis/ByString?includeDomain=true&limit=10&string=' + scriptPath + '&format=json', {
					responseType: 'json'
				} ).then( wiresponse => {
					var wibody = wiresponse.body;
					if ( wiresponse.statusCode !== 200 || !wibody || wibody.exception || !wibody.items || !wibody.items.length ) {
						console.log( '- ' + wiresponse.statusCode + ': Error while getting the wiki id: ' + wibody?.exception?.details );
						if ( reaction ) reaction.removeEmoji();
						return msg.replyMsg( lang.get('rcscript.no_feeds'), {}, true );
					}
					var site = wibody.items.find( site => site.domain === scriptPath );
					if ( site ) return got.get( 'https://services.fandom.com/discussion/' + site.id + '/posts?limit=1&format=json', {
						headers: {
							Accept: 'application/hal+json'
						},
						responseType: 'json'
					} ).then( dsresponse => {
						var dsbody = dsresponse.body;
						if ( dsresponse.statusCode !== 200 || !dsbody || dsbody.title ) {
							if ( dsbody?.title !== 'site doesn\'t exists' ) console.log( '- ' + dsresponse.statusCode + ': Error while checking for discussions: ' + dsbody?.title );
							if ( reaction ) reaction.removeEmoji();
							return msg.replyMsg( lang.get('rcscript.no_feeds'), {}, true );
						}
						msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
							webhook.send( lang.get('rcscript.webhook.enabled_feeds', site.name) + '\n<' + selected_row.wiki + 'f>' ).catch(log_error);
						}, log_error );
						db.run( 'UPDATE rcgcdw SET wikiid = ?, postid = ? WHERE webhook = ?', [parseInt(site.id, 10), null, selected_row.webhook], function (error) {
							if ( error ) {
								console.log( '- Error while updating the RcGcDw: ' + error );
								if ( reaction ) reaction.removeEmoji();
								msg.replyMsg( lang.get('settings.save_failed'), {}, true );
								return error;
							}
							console.log( '- RcGcDw successfully updated.' );
							if ( reaction ) reaction.removeEmoji();
							msg.replyMsg( lang.get('rcscript.enabled_feeds') + '\n`' + cmd + '`', {}, true );
						} );
					}, error => {
						console.log( '- Error while checking for discussions: ' + error );
						if ( reaction ) reaction.removeEmoji();
						return msg.replyMsg( lang.get('rcscript.no_feeds'), {}, true );
					} );
					console.log( '- No result while getting the wiki id.' );
					if ( reaction ) reaction.removeEmoji();
					return msg.replyMsg( lang.get('rcscript.no_feeds'), {}, true );
				}, error => {
					console.log( '- Error while getting the wiki id: ' + error );
					if ( reaction ) reaction.removeEmoji();
					return msg.replyMsg( lang.get('rcscript.no_feeds'), {}, true );
				} ) );
			}

			return msg.client.fetchWebhook(...selected_row.webhook.split('/')).then( webhook => {
				return webhook.channelID;
			}, error => {
				log_error(error);
				if ( error.toString() !== 'DiscordAPIError: Unknown Webhook' ) return;
				db.run( 'DELETE FROM rcgcdw WHERE webhook = ?', [selected_row.webhook], function (delerror) {
					if ( delerror ) {
						console.log( '- Error while removing the RcGcDw: ' + delerror );
						return delerror;
					}
					console.log( '- RcGcDw successfully removed.' );
				} );
				Promise.reject();
			} ).then( channel => {
				var text = lang.get('rcscript.current_selected') + '\n';
				text += '\n' + lang.get('rcscript.channel') + ' <#' + channel + '>\n';
				text += '\n' + lang.get('rcscript.wiki') + ' <' + selected_row.wiki + '>';
				text += '\n`' + cmd + ' wiki ' + lang.get('rcscript.new_wiki') + '`\n';
				text += '\n' + lang.get('rcscript.lang') + ' `' + allLangs.names[selected_row.lang] + '`';
				text += '\n`' + cmd + ' lang ' + lang.get('rcscript.new_lang') + '`\n';
				text += '\n' + lang.get('rcscript.display') + ' `' + display_types[selected_row.display] + '`';
				text += '\n`' + cmd + ' display (' + display.join('|') + ')`\n';
				if ( selected_row.wiki.isFandom() ) {
					text += '\n' + lang.get('rcscript.feeds') + ' *`' + lang.get('rcscript.' + ( selected_row.wikiid ? 'enabled' : 'disabled' )) + '`*';
					text += '\n' + lang.get('rcscript.help_feeds') + '\n`' + cmd + ' feeds` ' + lang.get('rcscript.toggle') + '\n';
				}
				text += '\n' + lang.get('rcscript.delete') + '\n`' + cmd + ' delete`\n';
				msg.replyMsg( text, {}, true );
			}, () => msg.replyMsg( lang.get('rcscript.deleted'), {}, true ) );
		}

		Promise.all(rows.map( row => msg.client.fetchWebhook(...row.webhook.split('/')).catch( error => {
			log_error(error);
			if ( error.toString() !== 'DiscordAPIError: Unknown Webhook' ) return {};
			db.run( 'DELETE FROM rcgcdw WHERE webhook = ?', [row.webhook], function (delerror) {
				if ( delerror ) {
					console.log( '- Error while removing the RcGcDw: ' + delerror );
					return delerror;
				}
				console.log( '- RcGcDw successfully removed.' );
			} );
			return;
		} ) )).then( webhooks => {
			rows.forEach( (row, i) => {
				if ( webhooks[i] ) row.channel = webhooks[i].channelID;
			} );
			rows = rows.filter( row => row.channel );
			var only = ( rows.length === 1 );
			var text = '';
			if ( rows.length ) text += lang.get('rcscript.current') + rows.map( row => {
				var cmd = prefix + 'rcscript' + ( only ? '' : ' ' + row.configid );
				var row_text = '\n';
				if ( !only ) row_text += '\n`' + cmd + '`';
				row_text += '\n' + lang.get('rcscript.channel') + ' <#' + row.channel + '>';
				if ( only ) row_text += '\n';
				row_text += '\n' + lang.get('rcscript.wiki') + ' <' + row.wiki + '>';
				if ( only ) row_text += '\n`' + cmd + ' wiki ' + lang.get('rcscript.new_wiki') + '`\n';
				row_text += '\n' + lang.get('rcscript.lang') + ' `' + allLangs.names[row.lang] + '`';
				if ( only ) row_text += '\n`' + cmd + ' lang ' + lang.get('rcscript.new_lang') + '`\n';
				row_text += '\n' + lang.get('rcscript.display') + ' `' + display_types[row.display] + '`';
				if ( only ) row_text += '\n`' + cmd + ' display (' + display.join('|') + ')`\n';
				if ( row.wiki.isFandom() ) {
					row_text += '\n' + lang.get('rcscript.feeds') + ' *`' + lang.get('rcscript.' + ( row.wikiid ? 'enabled' : 'disabled' )) + '`*';
					if ( only ) row_text += '\n' + lang.get('rcscript.help_feeds') + '\n`' + cmd + ' feeds` ' + lang.get('rcscript.toggle') + '\n';
				}
				if ( only ) row_text += '\n' + lang.get('rcscript.delete') + '\n`' + cmd + ' delete`\n';
				return row_text;
			} ).join('');
			else text += lang.get('rcscript.missing');
			if ( rows.length < limit ) text += '\n\n' + lang.get('rcscript.add_more') + '\n`' + prefix + 'rcscript add ' + lang.get('rcscript.new_wiki') + '`';
			msg.sendChannel( '<@' + msg.author.id + '>, ' + text, {split:true}, true );
		} );
	} );
}

/**
 * Turn user input into a wiki.
 * @param {String} input - The user input referring to a wiki.
 */
function input_to_wiki(input) {
	var regex = input.match( /^(?:https:\/\/)?([a-z\d-]{1,50}\.(?:gamepedia\.com|(?:fandom\.com|wikia\.org)(?:(?!\/wiki\/)\/[a-z-]{2,12})?))(?:\/|$)/ );
	if ( regex ) return 'https://' + regex[1] + '/';
	if ( input.startsWith( 'https://' ) ) {
		let project = wikiProjects.find( project => input.split('/')[2].endsWith( project.name ) );
		if ( project ) {
			regex = input.match( new RegExp( project.regex + `(?:${project.articlePath}|${project.scriptPath}|/?$)` ) );
			if ( regex ) return 'https://' + regex[1] + project.scriptPath;
		}
		let wiki = input.replace( /\/(?:api|index)\.php(?:|\?.*)$/, '/' );
		if ( !wiki.endsWith( '/' ) ) wiki += '/';
		return wiki;
	}
	let project = wikiProjects.find( project => input.split('/')[0].endsWith( project.name ) );
	if ( project ) {
		regex = input.match( new RegExp( project.regex + `(?:${project.articlePath}|${project.scriptPath}|/?$)` ) );
		if ( regex ) return 'https://' + regex[1] + project.scriptPath;
	}
	if ( allSites.some( site => site.wiki_domain === input + '.gamepedia.com' ) ) {
		return 'https://' + input + '.gamepedia.com/';
	}
	if ( /^(?:[a-z-]{2,12}\.)?[a-z\d-]{1,50}$/.test(input) ) {
		if ( !input.includes( '.' ) ) return 'https://' + input + '.fandom.com/';
		else return 'https://' + input.split('.')[1] + '.fandom.com/' + input.split('.')[0] + '/';
	}
	return;
}

module.exports = {
	name: 'rcscript',
	everyone: rcscriptExists,
	pause: rcscriptExists,
	owner: false,
	run: cmd_rcscript
};