const {Util} = require('discord.js');
const {timeoptions} = require('../util/default.json');

const overwrites = {
	randompage: (fn, lang, msg, wiki, reaction, spoiler) => {
		fn.random(lang, msg, wiki, reaction, spoiler)
	},
	diff: (fn, lang, msg, wiki, reaction, spoiler, args, embed) => {
		fn.diff(lang, msg, args, wiki, reaction, spoiler, embed)
	},
	statistics: (fn, lang, msg, wiki, reaction, spoiler) => {
		fn.overview(lang, msg, wiki, reaction, spoiler)
	}
}

const queryfunctions = {
	title: (query, wiki) => query.querypage.results.map( result => {
		return '[' + result.title.escapeFormatting() + '](' + wiki.toLink(result.title, '', '', query.general, true) + ')';
	} ).join('\n'),
	times: (query, wiki) => query.querypage.results.map( result => {
		return result.value + '× [' + result.title.escapeFormatting() + '](' + wiki.toLink(result.title, '', '', query.general, true) + ')';
	} ).join('\n'),
	size: (query, wiki) => query.querypage.results.map( result => {
		return result.value + ' bytes: [' + result.title.escapeFormatting() + '](' + wiki.toLink(result.title, '', '', query.general, true) + ')';
	} ).join('\n'),
	redirect: (query, wiki) => query.querypage.results.map( result => {
		return '[' + result.title.replace( / /g, '_' ).escapeFormatting() + '](' + wiki.toLink(result.title, 'redirect=no', '', query.general, true) + ')' + ( result.databaseResult && result.databaseResult.rd_title ? ' → ' + result.databaseResult.rd_title.escapeFormatting() : '' );
	} ).join('\n'),
	doubleredirect: (query, wiki) => query.querypage.results.map( result => {
		return '[' + result.title.replace( / /g, '_' ).escapeFormatting() + '](' + wiki.toLink(result.title, 'redirect=no', '', query.general, true) + ')' + ( result.databaseResult && result.databaseResult.b_title && result.databaseResult.c_title ? ' → ' + result.databaseResult.b_title.escapeFormatting() + ' → ' + result.databaseResult.c_title.escapeFormatting() : '' );
	} ).join('\n'),
	timestamp: (query, wiki) => query.querypage.results.map( result => {
		return new Date(result.timestamp).toLocaleString(lang.get('dateformat'), timeoptions).escapeFormatting() + ': [' + result.title.escapeFormatting() + '](' + wiki.toLink(result.title, '', '', query.general, true) + ')';
	} ).join('\n'),
	media: (query) => query.querypage.results.map( result => {
		var ms = result.title.split(';');
		return '**' + ms[1] + '**: ' + ms[2] + ' files (' + ms[3] + ' bytes)';
	} ).join('\n'),
	category: (query, wiki) => query.querypage.results.map( result => {
		return result.value + '× [' + result.title.escapeFormatting() + '](' + wiki.toLink('Category:' + result.title, '', '', query.general, true) + ')';
	} ).join('\n'),
	gadget: (query) => query.querypage.results.map( result => {
		result.title = result.title.replace( /^(?:.*:)?gadget-/, '' );
		return '**' + result.title.escapeFormatting() + '**: ' + result.value + ' users (' + result.ns + ' active)';
	} ).join('\n'),
	recentchanges: (query, wiki) => query.recentchanges.map( result => {
		return '[' + result.title.escapeFormatting() + '](' + wiki.toLink(result.title, ( result.type === 'edit' ? 'diff=' + result.revid + '&oldid=' + result.old_revid : '' ), '', query.general, true) + ')';
	} ).join('\n')
}

const querypages = {
	ancientpages: ['&list=querypage&qplimit=10&qppage=Ancientpages', queryfunctions.timestamp],
	brokenredirects: ['&list=querypage&qplimit=10&qppage=BrokenRedirects', queryfunctions.redirect],
	deadendpages: ['&list=querypage&qplimit=10&qppage=Deadendpages', queryfunctions.title],
	doubleredirects: ['&list=querypage&qplimit=10&qppage=DoubleRedirects', queryfunctions.doubleredirect],
	fewestrevisions: ['&list=querypage&qplimit=10&qppage=Fewestrevisions', queryfunctions.times],
	listduplicatedfiles: ['&list=querypage&qplimit=10&qppage=ListDuplicatedFiles', queryfunctions.times],
	listredirects: ['&list=querypage&qplimit=10&qppage=Listredirects', queryfunctions.redirect],
	lonelypages: ['&list=querypage&qplimit=10&qppage=Lonelypages', queryfunctions.title],
	longpages: ['&list=querypage&qplimit=10&qppage=Longpages', queryfunctions.size],
	mediastatistics: ['&list=querypage&qplimit=10&qppage=MediaStatistics', queryfunctions.media],
	mostcategories: ['&list=querypage&qplimit=10&qppage=Mostcategories', queryfunctions.times],
	mostimages: ['&list=querypage&qplimit=10&qppage=Mostimages', queryfunctions.times],
	mostinterwikis: ['&list=querypage&qplimit=10&qppage=Mostinterwikis', queryfunctions.times],
	mostlinked: ['&list=querypage&qplimit=10&qppage=Mostlinked', queryfunctions.times],
	mostlinkedcategories: ['&list=querypage&qplimit=10&qppage=Mostlinkedcategories', queryfunctions.times],
	mostlinkedtemplates: ['&list=querypage&qplimit=10&qppage=Mostlinkedtemplates', queryfunctions.times],
	mostrevisions: ['&list=querypage&qplimit=10&qppage=Mostrevisions', queryfunctions.times],
	shortpages: ['&list=querypage&qplimit=10&qppage=Shortpages', queryfunctions.size],
	uncategorizedcategories: ['&list=querypage&qplimit=10&qppage=Uncategorizedcategories', queryfunctions.title],
	uncategorizedpages: ['&list=querypage&qplimit=10&qppage=Uncategorizedpages', queryfunctions.title],
	uncategorizedimages: ['&list=querypage&qplimit=10&qppage=Uncategorizedimages', queryfunctions.title],
	uncategorizedtemplates: ['&list=querypage&qplimit=10&qppage=Uncategorizedtemplates', queryfunctions.title],
	unusedcategories: ['&list=querypage&qplimit=10&qppage=Unusedcategories', queryfunctions.title],
	unusedimages: ['&list=querypage&qplimit=10&qppage=Unusedimages', queryfunctions.title],
	unusedtemplates: ['&list=querypage&qplimit=10&qppage=Unusedtemplates', queryfunctions.title],
	unwatchedpages: ['&list=querypage&qplimit=10&qppage=Unwatchedpages', queryfunctions.title],
	wantedcategories: ['&list=querypage&qplimit=10&qppage=Wantedcategories', queryfunctions.times],
	wantedfiles: ['&list=querypage&qplimit=10&qppage=Wantedfiles', queryfunctions.times],
	wantedpages: ['&list=querypage&qplimit=10&qppage=Wantedpages', queryfunctions.times],
	wantedtemplates: ['&list=querypage&qplimit=10&qppage=Wantedtemplates', queryfunctions.times],
	withoutinterwiki: ['&list=querypage&qplimit=10&qppage=Withoutinterwiki', queryfunctions.title],
	gadgetusage: ['&list=querypage&qplimit=10&qppage=GadgetUsage', queryfunctions.gadget],
	recentchanges: ['&list=recentchanges&rctype=edit|new|log&rclimit=10', queryfunctions.recentchanges],
	disambiguations: ['&list=querypage&qplimit=10&qppage=Disambiguations', queryfunctions.title],
	mostpopularcategories: ['&list=querypage&qplimit=10&qppage=Mostpopularcategories', queryfunctions.category],
	mostlinkedfilesincontent: ['&list=querypage&qplimit=10&qppage=MostLinkedFilesInContent', queryfunctions.times],
	unusedvideos: ['&list=querypage&qplimit=10&qppage=UnusedVideos', queryfunctions.title],
	withoutimages: ['&list=querypage&qplimit=10&qppage=Withoutimages', queryfunctions.title],
	nonportableinfoboxes: ['&list=querypage&qplimit=10&qppage=Nonportableinfoboxes', queryfunctions.title],
	popularpages: ['&list=querypage&qplimit=10&qppage=Popularpages', queryfunctions.title],
	pageswithoutinfobox: ['&list=querypage&qplimit=10&qppage=Pageswithoutinfobox', queryfunctions.title],
	templateswithouttype: ['&list=querypage&qplimit=10&qppage=Templateswithouttype', queryfunctions.title],
	allinfoboxes: ['&list=querypage&qplimit=10&qppage=AllInfoboxes', queryfunctions.title]
}

const descriptions = {
	checkuser: 'checkuser-summary&amargs=16|19',
	resettokens: 'resettokens-text',
	allmessages: 'allmessagestext',
	expandtemplates: 'expand_templates_intro',
	apisandbox: 'apisandbox-intro',
	abusefilter: 'abusefilter-intro',
	gadgets: 'gadgets-pagetext',
	categorytree: 'categorytree-header',
	drafts: 'drafts-view-summary&amargs=30',
	analytics: 'analytics_confidential',
	mostlinkedfilesincontent: 'mostimagesincontent-summary',
	popularpages: 'insights-list-description-popularpages'
}

/**
 * Processes special pages.
 * @param {import('../util/i18n.js')} lang - The user language.
 * @param {import('discord.js').Message} msg - The Discord message.
 * @param {String} title - The title of the special page.
 * @param {String} specialpage - The canonical name of the special page.
 * @param {import('discord.js').MessageEmbed} embed - The embed for the page.
 * @param {String} wiki - The wiki for the page.
 * @param {import('discord.js').MessageReaction} reaction - The reaction on the message.
 * @param {String} spoiler - If the response is in a spoiler.
 */
function special_page(lang, msg, title, specialpage, embed, wiki, reaction, spoiler) {
	if ( specialpage in overwrites ) {
		var args = title.split('/').slice(1,3);
		overwrites[specialpage](this, lang, msg, wiki, reaction, spoiler, args, embed);
		return;
	}
	if ( specialpage === 'recentchanges' && msg.isAdmin() && msg.guild.id in patreons ) {
		embed.addField( lang.get('rcscript.title'), lang.get('rcscript.ad', ( patreons[msg?.guild?.id] || process.env.prefix ), '[RcGcDw](https://gitlab.com/piotrex43/RcGcDw)') );
	}
	got.get( wiki + 'api.php?action=query&meta=siteinfo|allmessages&siprop=general&amenableparser=true&amtitle=' + encodeURIComponent( title ) + '&ammessages=' + ( specialpage in descriptions ? descriptions[specialpage] : encodeURIComponent( specialpage ) + '-summary' ) + ( specialpage in querypages ? querypages[specialpage][0] : '' ) + '&format=json', {
		responseType: 'json'
	} ).then( response => {
		var body = response.body;
		if ( body && body.warnings ) log_warn(body.warnings);
		if ( response.statusCode !== 200 || !body ) {
			console.log( '- ' + response.statusCode + ': Error while getting the special page: ' + ( body && body.error && body.error.info ) );
		}
		else {
			if ( body.query.allmessages[0]['*'] ) {
				var description = body.query.allmessages[0]['*'].toPlaintext();
				if ( description.length > 2000 ) description = description.substring(0, 2000) + '\u2026';
				embed.setDescription( description );
			}
			if ( msg.channel.type === 'text' && msg.guild.id in patreons && specialpage in querypages ) {
				var text = Util.splitMessage( querypages[specialpage][1](body.query, wiki), {maxLength:1000} )[0];
				embed.addField( lang.get('search.special'), ( text || lang.get('search.empty') ) );
			}
		}
	}, error => {
		console.log( '- Error while getting the special page: ' + error );
	} ).finally( () => {
		msg.sendChannel( spoiler + '<' + embed.url + '>' + spoiler, {embed} );
		
		if ( reaction ) reaction.removeEmoji();
	} );
}

module.exports = special_page;