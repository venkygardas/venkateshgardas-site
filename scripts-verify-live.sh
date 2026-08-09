#!/bin/sh
# Post-deploy habit: verify the live site after every push.
# Cloudflare Pages serves stale cached bodies for same-URL asset edits;
# bump the ?r= / ?v= query in HTML when an image or stylesheet changes.
for u in / /photos /now /notes/ /cv /rss.xml "/styles.css?v=17"; do
  printf '%s ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' "https://venkateshgardas.com$u"
done
