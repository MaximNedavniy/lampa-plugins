/* Випадковий фільм for Lampa, version 1.1.0. ES5. */
(function () {
    'use strict';
    if (window.lampaRandomMovie) return;
    var state = { started: false, busy: false };
    window.lampaRandomMovie = state;
    var L, tries = 0;
    var genres = [
        { title: 'Будь-який', id: '' }, { title: 'Бойовик', id: '28' },
        { title: 'Пригоди', id: '12' }, { title: 'Анімація', id: '16' },
        { title: 'Комедія', id: '35' }, { title: 'Кримінал', id: '80' },
        { title: 'Документальний', id: '99' }, { title: 'Драма', id: '18' },
        { title: 'Сімейний', id: '10751' }, { title: 'Фентезі', id: '14' },
        { title: 'Історичний', id: '36' }, { title: 'Жахи', id: '27' },
        { title: 'Музичний', id: '10402' }, { title: 'Детектив', id: '9648' },
        { title: 'Мелодрама', id: '10749' }, { title: 'Фантастика', id: '878' },
        { title: 'Трилер', id: '53' }, { title: 'Воєнний', id: '10752' },
        { title: 'Вестерн', id: '37' }
    ];
    var countries = [
        { title: 'Будь-яка', id: '' }, { title: 'Україна', id: 'UA' },
        { title: 'США', id: 'US' }, { title: 'Велика Британія', id: 'GB' },
        { title: 'Канада', id: 'CA' }, { title: 'Франція', id: 'FR' },
        { title: 'Німеччина', id: 'DE' }, { title: 'Італія', id: 'IT' },
        { title: 'Іспанія', id: 'ES' }, { title: 'Польща', id: 'PL' },
        { title: 'Чехія', id: 'CZ' }, { title: 'Швеція', id: 'SE' },
        { title: 'Норвегія', id: 'NO' }, { title: 'Данія', id: 'DK' },
        { title: 'Фінляндія', id: 'FI' }, { title: 'Нідерланди', id: 'NL' },
        { title: 'Бельгія', id: 'BE' }, { title: 'Ірландія', id: 'IE' },
        { title: 'Австрія', id: 'AT' }, { title: 'Швейцарія', id: 'CH' },
        { title: 'Австралія', id: 'AU' }, { title: 'Нова Зеландія', id: 'NZ' },
        { title: 'Японія', id: 'JP' }, { title: 'Південна Корея', id: 'KR' },
        { title: 'Китай', id: 'CN' }, { title: 'Гонконг', id: 'HK' },
        { title: 'Тайвань', id: 'TW' }, { title: 'Індія', id: 'IN' },
        { title: 'Туреччина', id: 'TR' }, { title: 'Бразилія', id: 'BR' },
        { title: 'Аргентина', id: 'AR' }, { title: 'Мексика', id: 'MX' },
        { title: 'Південна Африка', id: 'ZA' }
    ];
    function countrySetting() {
        var id = String(read('country', ''));
        return countries.filter(function (country) { return country.id === id; })[0] || countries[0];
    }
    function read(key, fallback) {
        try { return L.Storage.get('random_movie_' + key, fallback); }
        catch (e) { return fallback; }
    }
    function save(key, value) {
        try { L.Storage.set('random_movie_' + key, value); } catch (e) {}
    }
    function restore() { L.Controller.toggle('menu'); }
    function select(title, items, callback, back) {
        L.Select.show({ title: title, items: items, onSelect: callback, onBack: back || restore });
    }
    function settings() {
        var genre = String(read('genre', ''));
        var rating = Number(read('rating', 6));
        var label = genres.filter(function (g) { return g.id === genre; })[0] || genres[0];
        select('Випадковий фільм', [
            { title: 'Знайти фільм', action: 'pick' },
            { title: 'Жанр: ' + label.title, action: 'genre' },
            { title: 'Країна: ' + countrySetting().title, action: 'country' },
            { title: 'Мінімальний рейтинг: ' + (rating || 'Будь-який'), action: 'rating' }
        ], function (item) {
            if (item.action === 'pick') { restore(); pick(); }
            if (item.action === 'country') select('Країна виробництва', countries, function (country) {
                save('country', country.id); settings();
            }, settings);
            if (item.action === 'genre') select('Жанр', genres, function (g) {
                save('genre', g.id); settings();
            }, settings);
            if (item.action === 'rating') select('Мінімальний рейтинг TMDB', [0, 5, 6, 7, 8].map(function (r) {
                return { title: r ? r + '+' : 'Будь-який', value: r };
            }), function (r) { save('rating', r.value); settings(); }, settings);
        });
    }
    function pick() {
        if (state.busy) return;
        var api = L.Api && L.Api.sources && L.Api.sources.tmdb;
        if (!api || typeof api.get !== 'function') {
            L.Noty.show('У цій версії Lampa недоступне джерело TMDB.'); return;
        }
        state.busy = true;
        L.Noty.show('Шукаємо фільм…');
        var active = true;
        var timer = window.setTimeout(function () { fail(); }, 35000);
        var history = read('history', []);
        if (!Array.isArray(history)) history = [];
        var genre = String(read('genre', ''));
        if (!genres.some(function (g) { return g.id === genre; })) genre = '';
        var rating = Number(read('rating', 6));
        if ([0, 5, 6, 7, 8].indexOf(rating) < 0) rating = 6;
        var now = new Date();
        var today = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
        var filter = {
            include_adult: 'false', include_video: 'false',
            'vote_average.gte': rating, 'vote_count.gte': 100,
            'primary_release_date.lte': today, sort_by: 'popularity.desc'
        };
        if (genre) filter.with_genres = genre;
        var country = countrySetting().id;
        if (country) filter.with_origin_country = country;
        function finish() {
            active = false; state.busy = false; window.clearTimeout(timer);
        }
        function fail() {
            if (!active) return;
            finish(); L.Noty.show('Не вдалося отримати фільми. Перевірте доступ до TMDB та спробуйте ще раз.');
        }
        function request(page, done) {
            try { api.get('discover/movie', { page: page, filter: filter }, function (data) {
                if (active) done(data || {});
            }, fail); } catch (e) { fail(); }
        }
        var attempted = {};
        function choose(data, page, pages, remaining) {
            attempted[page] = true;
            var cards = (Array.isArray(data.results) ? data.results : []).filter(function (card) {
                return card && card.id && card.title && !card.adult && card.release_date &&
                    card.release_date <= today && Number(card.vote_average) >= rating &&
                    Number(card.vote_count) >= 100 && (!genre ||
                        (Array.isArray(card.genre_ids) && card.genre_ids.indexOf(Number(genre)) >= 0));
            });
            var fresh = cards.filter(function (card) { return history.indexOf(String(card.id)) < 0; });
            if (fresh.length) {
                var card = fresh[Math.floor(Math.random() * fresh.length)];
                finish();
                save('history', history.concat(String(card.id)).slice(-100));
                L.Activity.push({ component: 'full', source: 'tmdb', method: 'movie', id: card.id, card: card });
                return;
            }
            var available = [];
            for (var i = 1; i <= pages; i++) if (!attempted[i]) available.push(i);
            if (remaining && available.length) {
                var next = available[Math.floor(Math.random() * available.length)];
                request(next, function (result) { choose(result, next, pages, remaining - 1); });
            } else {
                finish();
                L.Noty.show('Нових пропозицій не знайдено. Змініть жанр, країну або мінімальний рейтинг.');
            }
        }
        request(1, function (data) {
            var pages = Math.min(500, Math.max(1, Math.floor(Number(data.total_pages) || 1)));
            var page = 1 + Math.floor(Math.random() * pages);
            if (page === 1) choose(data, 1, pages, 3);
            else request(page, function (result) { choose(result, page, pages, 3); });
        });
    }
    function start() {
        if (state.started) return;
        var $ = window.jQuery || window.$;
        if (!$) return;
        var list = $('.menu .menu__list').eq(0);
        if (!list.length) return;
        var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h2m6 0h2m-6 5h2m-6 5h2m6 0h2"/></svg>';
        var item = $('<li class="menu__item selector random-movie-menu"><div class="menu__ico">' + icon + '</div><div class="menu__text">Випадковий фільм</div></li>');
        item.on('hover:enter', settings);
        list.append(item);
        state.started = true;
    }
    function boot() {
        L = window.Lampa;
        if (!L || !L.Listener) {
            if (++tries < 120) window.setTimeout(boot, 500);
            return;
        }
        if (window.appready) start();
        else L.Listener.follow('app', function (event) { if (event.type === 'ready') start(); });
    }
    boot();
}());
