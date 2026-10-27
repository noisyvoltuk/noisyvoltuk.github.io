#!/usr/bin/env python3
"""Export src/content to a WordPress WXR file for Tools > Import > WordPress.

    pip install markdown pyyaml
    python3 scripts/export-wxr.py > noisyvolt-export.xml

Mapping (slugs are kept so /notes/<id>/ and /music/<id>/ survive with the
permalink structure /%category%/%postname%/ and tag base "tags"):
  projects -> pages under a "Synths" page with slug "projects"
  notes    -> posts in category Notes
  music    -> posts in category Music, tagged original/listening
  links    -> link-format posts in category Links
  riffs    -> posts in category Riffs > Wanted / Learning / Recreated
  now.md   -> page "now"
Images and audio are pulled by the importer from the public GitHub repo.
"""
import datetime
import email.utils
import html
import pathlib
import re
import sys

import markdown
import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = 'https://raw.githubusercontent.com/noisyvoltuk/noisyvoltuk.github.io/main/'
SITE = 'https://noisyvolt.com'
AUTHOR = 'andrew'

CATEGORIES = [  # slug, name, parent slug
    ('notes', 'Notes', ''),
    ('music', 'Music', ''),
    ('links', 'Links', ''),
    ('riffs', 'Riffs', ''),
    ('wanted', 'Wanted', 'riffs'),
    ('learning', 'Learning', 'riffs'),
    ('recreated', 'Recreated', 'riffs'),
]

items = []
tags = set()
next_id = [100]


def new_id():
    next_id[0] += 1
    return next_id[0]


def read(path):
    text = path.read_text(encoding='utf-8')
    m = re.match(r'^---\n(.*?)\n---\n?(.*)$', text, re.S)
    return yaml.safe_load(m.group(1)) or {}, m.group(2).strip()


def md(body):
    # Strip "placeholder copy" lines that tell you to edit the Astro source.
    body = '\n'.join(l for l in body.splitlines() if 'src/content/' not in l and 'src/pages/' not in l and 'public/audio/' not in l)
    return markdown.markdown(body, extensions=['fenced_code', 'tables'])


def as_date(d):
    if isinstance(d, datetime.datetime):
        return d
    return datetime.datetime.combine(d, datetime.time(9, 0))


def esc(s):
    return html.escape(str(s), quote=True)


def attachment(path, parent, alt=''):
    """Add an attachment item (once per file); returns (id, url)."""
    url = RAW + path
    for it in items:
        if it.get('url') == url:
            return it['id'], url
    aid = new_id()
    items.append(dict(id=aid, type='attachment', title=pathlib.Path(path).stem, slug=pathlib.Path(path).stem,
                      date=items_date[0], parent=parent, url=url, content='', alt=alt, cats=[], tags=[], meta={}))
    return aid, url


items_date = [datetime.datetime(2026, 1, 1)]


def add(**kw):
    kw.setdefault('id', new_id())
    kw.setdefault('parent', 0)
    kw.setdefault('cats', [])
    kw.setdefault('tags', [])
    kw.setdefault('meta', {})
    kw.setdefault('format', '')
    tags.update(kw['tags'])
    items.append(kw)
    return kw['id']


def figure(url, alt, caption=True):
    cap = f'<figcaption>{esc(alt)}</figcaption>' if caption and alt else ''
    return f'<figure><img src="{esc(url)}" alt="{esc(alt)}" />{cap}</figure>'


def tag_list(fm):
    return [str(t).strip().lower() for t in fm.get('tags') or [] if str(t).strip()]


def collection(name):
    return sorted((ROOT / 'src/content' / name).glob('*.md'))


# Parent page for the synth projects, so they live at /projects/<id>/.
synths = add(type='page', title='Synths', slug='projects', date=datetime.datetime(2026, 5, 1, 9),
             content='<p>Synthesizers I have built or am building.</p>')

for p in collection('projects'):
    fm, body = read(p)
    pid = new_id()
    items_date[0] = as_date(fm['date'])
    parts = [f'<p><em>{esc(fm["summary"])}</em></p>']
    hero_id, _ = attachment('src/assets/projects/' + pathlib.Path(fm['hero']).name, pid, fm.get('heroAlt', ''))
    if fm.get('audio'):
        _, aurl = attachment('public' + fm['audio']['src'], pid)
        if fm['audio'].get('title'):
            parts.append(f'<p>{esc(fm["audio"]["title"])}</p>')
        parts.append(f'[audio mp3="{aurl}"][/audio]')
    parts.append(md(body))
    for g in fm.get('gallery') or []:
        _, gurl = attachment('src/assets/projects/' + pathlib.Path(g['src']).name, pid, g.get('alt', ''))
        parts.append(figure(gurl, g.get('alt', '')))
    if fm.get('repo'):
        parts.append(f'<p>Code: <a href="{esc(fm["repo"])}">{esc(fm["repo"])}</a></p>')
    parts.append(f'<p>Status: {esc(fm.get("status", "active"))}</p>')
    add(id=pid, type='page', title=fm['title'], slug=p.stem, date=as_date(fm['date']), parent=synths,
        content='\n\n'.join(parts), excerpt=fm['summary'],
        meta={'_thumbnail_id': hero_id, 'project_status': fm.get('status', 'active'), 'project_repo': fm.get('repo', '')})

for p in collection('notes'):
    fm, body = read(p)
    add(type='post', title=fm['title'], slug=p.stem, date=as_date(fm['date']), content=md(body),
        cats=['notes'], tags=tag_list(fm))

for p in collection('music'):
    fm, body = read(p)
    pid = new_id()
    items_date[0] = as_date(fm['date'])
    parts = []
    if fm.get('artist'):
        parts.append(f'<p><strong>{esc(fm["artist"])}</strong></p>')
    if fm.get('audio'):
        _, aurl = attachment('public' + fm['audio'], pid)
        parts.append(f'[audio mp3="{aurl}"][/audio]')
    parts.append(md(body))
    for key, label in (('source', 'Source'), ('url', 'Listen')):
        if fm.get(key):
            parts.append(f'<p>{label}: <a href="{esc(fm[key])}">{esc(fm[key])}</a></p>')
    add(id=pid, type='post', title=fm['title'], slug=p.stem, date=as_date(fm['date']), content='\n\n'.join(parts),
        cats=['music'], tags=tag_list(fm) + [fm['kind']])

for p in collection('links'):
    fm, body = read(p)
    content = f'<p><a href="{esc(fm["url"])}">{esc(fm["title"])}</a></p>'
    if fm.get('comment'):
        content += f'\n\n<p>{esc(fm["comment"])}</p>'
    add(type='post', title=fm['title'], slug=p.stem, date=as_date(fm['date']), content=content,
        cats=['links'], tags=tag_list(fm), format='link', meta={'link_url': fm['url']})

for p in collection('riffs'):
    fm, body = read(p)
    status, kind = fm.get('status', 'wanted'), fm.get('type', 'riff')
    parts = []
    if fm.get('artist'):
        parts.append(f'<p><strong>{esc(fm["artist"])}</strong> ({esc(kind)})</p>')
    if fm.get('url'):
        parts.append(f'<p>Reference: <a href="{esc(fm["url"])}">{esc(fm["url"])}</a></p>')
    parts.append(md(body))
    if fm.get('result'):
        parts.append(f'<p>My version: <a href="{esc(fm["result"])}">{esc(fm["result"])}</a></p>')
    add(type='post', title=fm['title'], slug=p.stem, date=as_date(fm['date']), content='\n\n'.join(parts),
        cats=['riffs', status], tags=tag_list(fm),
        meta={'riff_artist': fm.get('artist', ''), 'riff_type': kind, 'riff_status': status, 'riff_url': fm.get('url', '')})

fm, body = read(ROOT / 'src/pages/now.md')
add(type='page', title=fm['title'], slug='now', date=as_date(fm['updated']), content=md(body), excerpt=fm.get('description', ''))


def cdata(s):
    return '<![CDATA[' + str(s).replace(']]>', ']]]]><![CDATA[>') + ']]>'


def item_xml(it):
    d = it['date']
    out = [
        '<item>',
        f'<title>{cdata(it["title"])}</title>',
        f'<pubDate>{email.utils.format_datetime(d.replace(tzinfo=datetime.timezone.utc))}</pubDate>',
        f'<dc:creator>{cdata(AUTHOR)}</dc:creator>',
        f'<content:encoded>{cdata(it.get("content", ""))}</content:encoded>',
        f'<excerpt:encoded>{cdata(it.get("excerpt", ""))}</excerpt:encoded>',
        f'<wp:post_id>{it["id"]}</wp:post_id>',
        f'<wp:post_date>{cdata(d.strftime("%Y-%m-%d %H:%M:%S"))}</wp:post_date>',
        f'<wp:post_date_gmt>{cdata(d.strftime("%Y-%m-%d %H:%M:%S"))}</wp:post_date_gmt>',
        '<wp:comment_status><![CDATA[closed]]></wp:comment_status>',
        '<wp:ping_status><![CDATA[closed]]></wp:ping_status>',
        f'<wp:post_name>{cdata(it["slug"])}</wp:post_name>',
        f'<wp:status>{cdata("inherit" if it["type"] == "attachment" else "publish")}</wp:status>',
        f'<wp:post_parent>{it["parent"]}</wp:post_parent>',
        '<wp:menu_order>0</wp:menu_order>',
        f'<wp:post_type>{cdata(it["type"])}</wp:post_type>',
        '<wp:post_password><![CDATA[]]></wp:post_password>',
        '<wp:is_sticky>0</wp:is_sticky>',
    ]
    if it['type'] == 'attachment':
        out.append(f'<wp:attachment_url>{cdata(it["url"])}</wp:attachment_url>')
        if it.get('alt'):
            it['meta']['_wp_attachment_image_alt'] = it['alt']
    for c in it['cats']:
        name = next(n for s, n, _ in CATEGORIES if s == c)
        out.append(f'<category domain="category" nicename="{c}">{cdata(name)}</category>')
    for t in it['tags']:
        out.append(f'<category domain="post_tag" nicename="{esc(t)}">{cdata(t)}</category>')
    if it.get('format'):
        out.append(f'<category domain="post_format" nicename="post-format-{it["format"]}">{cdata(it["format"].title())}</category>')
    for k, v in it['meta'].items():
        if v != '':
            out.append(f'<wp:postmeta><wp:meta_key>{cdata(k)}</wp:meta_key><wp:meta_value>{cdata(v)}</wp:meta_value></wp:postmeta>')
    out.append('</item>')
    return '\n'.join(out)


head = f'''<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
	xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
<title>NoisyVolt</title>
<link>{SITE}</link>
<description>Music and synthesizers</description>
<language>en-GB</language>
<wp:wxr_version>1.2</wp:wxr_version>
<wp:base_site_url>{SITE}</wp:base_site_url>
<wp:base_blog_url>{SITE}</wp:base_blog_url>
<wp:author><wp:author_id>1</wp:author_id><wp:author_login>{cdata(AUTHOR)}</wp:author_login><wp:author_email>{cdata('')}</wp:author_email><wp:author_display_name>{cdata(AUTHOR)}</wp:author_display_name></wp:author>
'''
parts = [head]
for i, (slug, name, parent) in enumerate(CATEGORIES, 1):
    parts.append(f'<wp:category><wp:term_id>{i}</wp:term_id><wp:category_nicename>{cdata(slug)}</wp:category_nicename>'
                 f'<wp:category_parent>{cdata(parent)}</wp:category_parent><wp:cat_name>{cdata(name)}</wp:cat_name></wp:category>')
for i, t in enumerate(sorted(tags), 50):
    parts.append(f'<wp:tag><wp:term_id>{i}</wp:term_id><wp:tag_slug>{cdata(t)}</wp:tag_slug><wp:tag_name>{cdata(t)}</wp:tag_name></wp:tag>')
# Attachments first so featured images resolve when the pages import.
for it in sorted(items, key=lambda it: it['type'] != 'attachment'):
    parts.append(item_xml(it))
parts.append('</channel>\n</rss>\n')
sys.stdout.write('\n'.join(parts))
