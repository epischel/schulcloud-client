const stripHtml = require('string-strip-html');

const ghostTheme = $('#SC_THEME').text();

function fetchContent() {
	let finalHtml = '';

	$(`.${ghostTheme}-blog .spinner`).show();
	$(`.${ghostTheme}-blog .placeholder`).hide();

	const changePage = () => {
		$(`.${ghostTheme}-blog .loading`).remove();
		finalHtml = finalHtml
			.replace(/<td>x<[/]td>/g, '<td><i class="fa fa-check"></i></td>');
		$(`.${ghostTheme}-blog .content`).html(stripHtml(finalHtml,
			{ onlyStripTags: ['script', 'style'] }));
		$(`.${ghostTheme}-blog .content`).css('opacity', '1');
	};

	const themeUrl = ghostTheme === 'n21' ? '/ghost/startseite-nbc' : `/ghost/startseite-${ghostTheme}`;

	$.ajax({
		url: themeUrl,
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		timeout: 8000,
	})
		.done((result) => {
			finalHtml = result.pages[0].html;
			changePage();
		})
		.fail(() => {
			$(`.${ghostTheme}-blog .spinner`).hide();
			$(`.${ghostTheme}-blog .placeholder`).show();
		});
}

$(document).ready(() => {
	fetchContent();
	$(`.${ghostTheme}-blog .placeholder button`).on('click', fetchContent);
});
