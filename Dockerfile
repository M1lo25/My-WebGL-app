FROM httpd:2.4

# 0) Abilita i moduli filter, deflate e headers
RUN sed -i \
    -e 's|#LoadModule filter_module modules/mod_filter.so|LoadModule filter_module modules/mod_filter.so|' \
    -e 's|#LoadModule deflate_module modules/mod_deflate.so|LoadModule deflate_module modules/mod_deflate.so|' \
    -e 's|#LoadModule headers_module modules/mod_headers.so|LoadModule headers_module modules/mod_headers.so|' \
    /usr/local/apache2/conf/httpd.conf

# 1) Copia le configurazioni custom in conf/extra
COPY httpd-webgl.conf /usr/local/apache2/conf/extra/httpd-webgl.conf
COPY gzip.conf       /usr/local/apache2/conf/extra/gzip.conf

# 2) Includi i due file custom in httpd.conf
RUN sed -i '$ a Include conf/extra/httpd-webgl.conf' /usr/local/apache2/conf/httpd.conf \
 && sed -i '$ a Include conf/extra/gzip.conf'          /usr/local/apache2/conf/httpd.conf

# 3) Copia TUTTI gli asset unificati da webgl/ (index.html, 403.html, Build/, TemplateData/, css/, img/)
COPY webgl /usr/local/apache2/htdocs/webgl

# 4) Sistema permessi
RUN chown -R www-data:www-data /usr/local/apache2/htdocs \
 && chmod -R 755              /usr/local/apache2/htdocs

# 5) Esponi porta HTTP e lancia Apache in foreground
EXPOSE 80
CMD ["httpd-foreground"]
