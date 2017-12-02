Array.prototype.getLastVal = function (){ return this[this.length -1];}

var tootPic = {
    pic_url: "https://tootpic.net",
    client_name: "Tootpic",
    domain_reg_rule: new RegExp(/^[0-9a-zA-Z\-]+\.[0-9a-zA-Z\-]+$/, 'gi'),
    tag_reg_rule: new RegExp(/^[\w\u30a0-\u30ff\u3040-\u309f\u30e0-\u9fcf０-ｚ]+$/, 'gi'),

    // 非同期HTTPリクエスト
    httpRequest: function(url, method, header, data, callback, error) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    callback(this.responseText);
                } else {
                    error(this.responseText);
                }
            }
        }
        xhr.open(method, url, true);
        for (key in header) {
            xhr.setRequestHeader(key, header[key]);            
        }
        xhr.send(JSON.stringify(data));
    },

    gallery: {
        addList: function(media_list) {
            media_list.forEach(function(media) {
                if (media['type'] == 'youtube') {
                    tootPic.gallery.addYoutube(media);
                }
                if (media['type'] == 'twitch') {
                    tootPic.gallery.addTwitch(media);
                }
                if (media['type'] == 'niconico') {
                    tootPic.gallery.addNiconico(media);
                }
                if (media['type'] == 'soundcloud') {
                    tootPic.gallery.addSoundcloud(media);
                }
                if (media['type'] == 'video') {
                    tootPic.gallery.addVideo(media);
                }
                if (media['type'] == 'img') {
                    tootPic.gallery.addImage(media);
                }
            });
        },
        addYoutube: function(embed) {
            $('.container > .row').append('<div class="card" id="'+embed['id']+'"><iframe height="225" src="https://www.youtube.com/embed/'+embed['embed_id']+'" frameborder="0" allowfullscreen></iframe>'+embed['content']+'</div>');
        },
        addTwitch: function(embed) {
            $('.container > .row').append('<div class="card" id="'+embed['id']+'"><iframe height="225" src="https://clips.twitch.tv/embed?clip='+embed['embed_id']+'&autoplay=false&tt_medium=clips_embed frameborder="0" allowfullscreen></iframe>'+embed['content']+'</div>');
        },
        addNiconico: function(embed) {
            $('.container > .row').append('<div class="card" id="'+embed['id']+'"><iframe height="225" src="https://us-central1-tootpic-dbac7.cloudfunctions.net/nicoScript?id='+embed['embed_id']+'"></iframe>'+embed['content']+'</div>');
        },
        addSoundcloud: function(embed) {
            $('.container > .row').append('<div class="card" id="'+embed['id']+'"></div>');
            var url = "http://soundcloud.com/oembed?format=json&url=https://soundcloud.com/"+embed['embed_id'];
            tootPic.httpRequest(url, "GET", {}, {}, function(responseText) {
                var arr = JSON.parse(responseText);
                $('.container > .row > #'+embed['id']).append(arr['html']+embed['content']);
            }, function() {
                $('.container > .row > #'+embed['id']).remove();
            });
        },
        addVideo: function(video) {
            var media_spoiler = "";
            var video_display = "";
            if (video['sensitive']) {
                media_spoiler = '<img src="./spoiler.png" class="spoiler" />';
                video_display = "style='display:none;'";
            }
            $('.container > .row').append('<div class="card" id="'+video['id']+'"><video '+video_display+' controls height="225" loop class="video-js" preload="auto" poster="'+video['src']+'" data-setup="{}"><source src="'+video['src']+'" type="video/mp4"></video>'+media_spoiler+video['content']+'</div>');
        },
        addImage: function(image) {
            var media_spoiler = "";
            var image_display = "";
            if (image['sensitive']) {
                media_spoiler = '<img src="./spoiler.png" class="spoiler" />';
                image_display = "style='display:none;'";
            }
            $(".container > .row").append('<div class="card" id="'+image['id']+'"><a '+image_display+' href="'+image['src']+'"><img src="'+image['thumb']+'"></a>'+media_spoiler+image['content']+'</div>');
        },
        embedSoundcloud: function(response) {
            console.log(response);
        },
/*        writeNicoVideoPlayer: function(player) {
            player.width = "400";
            player.height = "255";
            player.write(id);
        },
 */       init: function() {
            $("body").on("click", ".status__content__spoiler-link", function(e) {
                var id = $(this).parent().parent().parent().parent().parent().parent().attr("id");
                if ($("div#"+id+" .e-content").css("display")=="none") {
                    $("div#"+id+" .e-content").show();
                    $("div#"+id+" .status__content__spoiler-link").text("隠す");
                } else {
                    $("div#"+id+" .e-content").hide();
                    $("div#"+id+" .status__content__spoiler-link").text("もっと見る");
                }
                e.stopPropagation();
            });
            $("body").on("click", ".spoiler", function() {
                $(this).hide();
                $(this).prev().show();
            });
        },
    },

    // アカウント情報の管理、トゥートの投稿、タイムラインの管理
    mstdn: {
        domain: localStorage.getItem('mstdn_domain') ? localStorage.getItem('mstdn_domain') : "biwakodon.com",

        setDomain: function(domain) {
            this.domain = domain;
            localStorage.setItem("mstdn_domain", domain);
        },

        timeline: {
            tag: localStorage.getItem('tag') ? localStorage.getItem('tag') : "biwakomap",
            limit: 40,
            max_id: "",
            last_date: "",

            setMaxId: function(max_id) {
                this.max_id = max_id;
            },
            setLastDate: function(last_date) {
                this.last_date = last_date;
                $("#past-tagtl").html("過去のトゥート<br />("+tootPic.getFormatDate(last_date)+"以前)");
            },
            setTag: function(tag) {
                this.tag = tag;
                localStorage.setItem("tag", tag);
            },
            clear: function() {
                this.setMaxId("");
                this.setLastDate("");
            },
            match: function(toot) {
                media = toot['media_attachments'].length > 0;
                var embed = new Array();
                tootPic.mstdn.timeline._checkURL(embed, toot, /https:\/\/youtu\.be\/([^"]+)/, 'youtube');
                tootPic.mstdn.timeline._checkURL(embed, toot, /https:\/\/www\.youtube\.com\/watch\?v=([^"]+)/, 'youtube');
                tootPic.mstdn.timeline._checkURL(embed, toot, /https:\/\/clips\.twitch\.tv\/([^"]+)/, 'twitch');
                tootPic.mstdn.timeline._checkURL(embed, toot, /https?:\/\/nico\.ms\/sm([0-9]+)/, 'niconico');
                tootPic.mstdn.timeline._checkURL(embed, toot, /https:\/\/soundcloud\.com\/(([0-9a-zA-Z]+)\/([0-9a-zA-Z\-]+))/, 'soundcloud');
                toot['embed'] = embed;
                return media || embed;
            },

            _checkURL: function(arr, toot, pattern, type) {
                reg_gi = new RegExp(pattern, 'gi');
                reg_i = new RegExp(pattern, 'i');
                match = toot['content'].match(reg_gi);
                if (match) {
                    match.forEach(function(url) {
                        part = url.match(reg_i);
                        arr.push({
                            'url': url,
                            'id': part[1],
                            'type': type
                        });
                    });
                }
            },
            checkNicoNico: function(toot) {
                var niconico = new Array();
                tootPic.mstdn.timeline._checkURL(niconico, toot, /https:\/\/clips\.twitch\.tv\/([^"]+)/);
                toot['niconico'] = niconico;
                return niconico;
            },
            innerHTML: function(toot) {
                var date = (new Date(toot['created_at'])).toLocaleString();
                var attachments_html = "";
                var display = "";
                var spoiler_html  = "";
                if (toot['spoiler_text'].length > 0) {
                    display = "style='display:none;'";
                    spoiler_html = '<p><span class="p-summary">'+twemoji.parse(toot['spoiler_text'])+'</span><span class="status__content__spoiler-link">もっと見る</span></p>';
                }
                html = '<div class="activity-stream activity-stream-headless h-entry content"><div class="entry entry-center"><div class="detailed-status light">'
                    +'<a class="detailed-status__display-name p-author h-card" rel="noopener" target="_blank" href="'+toot['account']['url']+'">'
                        +'<div><div class="avatar">'
                            +'<img alt="" class="u-photo" src="'+toot['account']['avatar']+'" width="48" height="48">'
                        +'</div></div>'
                        +'<span class="display-name">'
                            +'<strong class="p-name emojify">'+twemoji.parse(toot['account']['display_name'] != '' ? toot['account']['display_name'] : toot['account']['username'])+'</strong>'
                            +'<span>@'+toot['account']['acct']+'</span>'
                        +'</span>'
                        +'</a>'
                    +'<div class="status__content p-name emojify">'
                        +spoiler_html
                        +'<div class="e-content" '+display+'><p>'+twemoji.parse(toot['content'])+'</p></div>'
                        +'</div>'
                    +'<div class="detailed-status__meta">'
                        +'<data class="dt-published" value="'+date+'"></data>'
                        +'<a class="detailed-status__datetime u-url u-uid" rel="noopener" target="_blank" href="'+toot['url']+'"><time class="formatted" datetime="'+toot['created_at']+'" title="'+date+'">'+date+'</time></a>'
                        +'·'
                        +'<span><i class="fa fa-retweet"></i><span>'+toot['reblogs_count']+' Reb</span></span>'
                        +'·'
                        +'<span><i class="fa fa-star"></i><span>'+toot['favourites_count']+' Fav</span></span>'
                        +'·'
                        +'<a class="open-in-web-link" target="_blank" href="'+toot['url']+'">Webで開く</a>'
                    +'</div>'
                +'</div></div></div>';
                return html;
            },

            // タイムラインの取得
            get: function() {
                var url = "https://"+tootPic.mstdn.domain+"/api/v1/timelines/tag/"+encodeURIComponent(tootPic.mstdn.timeline.tag)+"?limit="+tootPic.mstdn.timeline.limit+"&max_id="+tootPic.mstdn.timeline.max_id;
                var method = "GET";
                var header = {};
                var data = {};
                tootPic.httpRequest(url, method, header, data,
                    function(responseText) {
                        var media_list = [];
                        var caption_list = [];
                        var video_list = [];

                        if (responseText.length == 0) {
                            tootPic.mstdn.timeline.get();
                            return;
                        }

                        var arr = JSON.parse(responseText);
                        arr.forEach(function(toot) {
                            if (tootPic.mstdn.timeline.match(toot)) {
                                // 不要な部分を消去
                                $.each($.parseHTML(toot['content']), function(i, p) {$.each(p.children, function(v, e) {
                                    // ハッシュタグを消去
                                    if (e.nodeName == "A" && e.className == "mention hashtag" && e.innerText.toUpperCase() == "#"+tootPic.mstdn.timeline.tag.toUpperCase()) {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                    // 添付ファイルパスを消去
                                    if (e.nodeName == "A" && e.pathname.match(/^\/media\/[^/]+$/)) {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                    // Youtubeリンクを消去
                                    if (e.nodeName == "A" && (e.hostname == "youtu.be" || (e.hostname == "www.youtube.com" && e.pathname.match(/^\/watch$/)))) {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                    // Twitchリンクを消去
                                    if (e.nodeName == "A" && e.hostname == "clips.twitch.tv") {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                    // Niconicoリンクを消去
                                    if (e.nodeName == "A" && e.hostname == "nico.ms") {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                    // Soundcloudリンクを消去
                                    if (e.nodeName == "A" && e.hostname == "soundcloud.com") {
                                        toot['content'] = toot['content'].replace(e.outerHTML, "");
                                    }
                                });});

                                // カスタム絵文字変換
                                if (typeof(toot['emojis'])!="undefined") {
                                    toot['emojis'].forEach(function(emoji) {
                                        var r = new RegExp(":"+emoji['shortcode']+":");
                                        while (toot['content'].match(r)) {
                                            toot['content'] = toot['content'].replace(r, '<img draggable="false" class="emojione" alt="'+emoji['shortcode']+'" title="'+emoji['shortcode']+'" src="'+emoji['url']+'">');
                                        }
                                    });
                                }

                                toot['media_attachments'].forEach(function(attachment) {
                                    var type = 'img';
                                    if (attachment['type'] == 'gifv') {
                                        type = 'video';
                                    }
                                    media_list.push({
                                        'id': toot['id'],
                                        'type': type,
                                        'src': attachment['url'],
                                        'thumb': attachment['preview_url'],
                                        'content': tootPic.mstdn.timeline.innerHTML(toot),
                                        'sensitive': toot['sensitive']
                                    });
                                });
                                if (typeof(toot['embed']) != "undefined") {
                                    toot['embed'].forEach(function(url) {
                                        media_list.push({
                                            'id': toot['id'],
                                            'type': url['type'],
                                            'embed_id': url['id'],
                                            'url': url['url'],
                                            'content': tootPic.mstdn.timeline.innerHTML(toot),
                                            'sensitive': toot['sensitive']
                                         });
                                    });
                                }
                            }
                        });

                        tootPic.gallery.addList(media_list);

                        if (arr.length) {
                            var last_toot = arr.getLastVal();
                            tootPic.mstdn.timeline.setMaxId(last_toot['id']);
                            tootPic.mstdn.timeline.setLastDate(last_toot['created_at']);
                        }
                        
                        tootPic.hideLoader();
                    },
                    function(responseText) {
                        alert("タイムラインを取得できませんでした");
                        tootPic.hideLoader();
                    }
                );
                tootPic.displayLoader();
            },
        },
    },

    // GET引数
    params: {
        query: "",
        tag: null,
        flg: false,
        test: "f",

        setQuery: function(query) {
            this.query = query;
        },

        _get: function(parameter_name, rule, def_val) {
            def_val = typeof(def_val)=="undefined"?null:def_val;
            var ret = def_val, tmp = [];
            this.query.substr(1).split("&").forEach(function (item) {
                tmp = item.split("=");
                try {
                    param = decodeURIComponent(tmp[1]);
                }  catch(e) {
                    param = "";
                }
                if (tmp[0] === parameter_name && (typeof(rule) == "undefined" || rule == null || param.match(rule))) {
                    ret = param;
                }
            });
            return ret;
        },
        all_get() {
            this.domain = this._get('domain', tootPic.domain_reg_rule, tootPic.mstdn.domain);
            this.tag = this._get('tag', tootPic.tag_reg_rule, tootPic.mstdn.timeline.tag);
            this.test = this._get('test', /^t$/, "f");
            this.flg = this._get('lat')!=null;
        },
        get: function() {
            this.setQuery(location.search);
            return this.all_get();
        }
    },

    displayLoader: function() {
        $('#loading-bg').height($(window).height()).css('display','block');
        $('#loading').height($(window).height()).css('display','block');
    },
    hideLoader: function() {
        $('#loading-bg').delay(600).fadeOut(300);
        $('#loading').delay(600).fadeOut(300);
    },

    getShareUrl: function() {
        return "https://"+tootPic.mstdn.domain+"/share?text="+encodeURIComponent("\n"+tootPic.pic_url+"/?domain="+tootPic.mstdn.domain+"&tag="+encodeURIComponent(tootPic.mstdn.timeline.tag)+" #"+tootPic.mstdn.timeline.tag);
    },
    menuInit: function() {
        $("#domain").val(tootPic.mstdn.domain);
        $("#hashtag").val(tootPic.mstdn.timeline.tag);
        $("body").on('change', '#domain', function() {
            var match = this.value.match(tootPic.domain_reg_rule);
            if (match) {
                tootPic.mstdn.setDomain(match[0]);
                $('.container > .row').empty();
                tootPic.mstdn.timeline.setMaxId("");
                tootPic.mstdn.timeline.get();
                $(".toot-btn").attr("href", tootPic.getShareUrl());
                $("#domain-error").remove();
            } else {
                if ($("#domain-error").length==0) {
                    alert("有効なドメインを入力してください。");
                }
            }
        });
        $("body").on('change', '#hashtag', function() {
            var match = this.value.match(tootPic.tag_reg_rule);
            if (match) {
                tootPic.mstdn.timeline.setTag(match[0]);
                $('.container > .row').empty();
                tootPic.mstdn.timeline.setMaxId("");
                tootPic.mstdn.timeline.get();
                $(".toot-btn").attr("href", tootPic.getShareUrl());
                $("#hashtag-error").remove();
            } else {
                if ($("#tag-error").length==0) {
                    alert("有効なタグを入力してください。");                    
                }
            }
        });
        $("body").on("click", "#more", function() {
            tootPic.mstdn.timeline.get();
            return false;
        });
        $(".toot-btn").attr("href", tootPic.getShareUrl());
    },

    // 最終取得トゥートの時間を表示
    getFormatDate: function(date) {
        date = new Date(date);
        if (isNaN(date)) { return ''; }
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        var d = date.getDate();
        var h = date.getHours();
        var M = date.getMinutes();
        var s = date.getSeconds();

        return y + '/' + m + '/' + d + ' ' + h + ':' + M + ':' + s;
    },

    // テスト
    test: function() {
        var script = document.createElement('script');
        script.src = './test.js';
        document.body.appendChild(script);
    },

    initialize: function() {
        this.params.get();
        this.mstdn.setDomain(this.params.domain);
        this.mstdn.timeline.setTag(this.params.tag);
        this.menuInit();

        this.gallery.init();

        this.mstdn.timeline.get();

        $(window).bottom();
        $(window).bind("bottom", function() {
            tootPic.mstdn.timeline.get();
        });

        // テストモード
        if (this.params.test=="t") {
            tootPic.test();
            return;
        }
    }
};

$(function(){
    tootPic.initialize();
});