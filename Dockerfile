FROM httpd:2.4

COPY httpd-webgl.conf /usr/local/apache2/conf/httpd.conf
COPY gzip.conf /usr/local/apache2/conf/extra/gzip.conf

RUN echo "" \
    && echo "# --- Include gzip.conf per servire file .gz ---" \
    && echo "Include conf/extra/gzip.conf" \
    >> /usr/local/apache2/conf/httpd.conf

# Copio i file WebGL
COPY ./webgl/ /usr/local/apache2/htdocs/

# (facoltativo) Imposto i permessi della cartella dei log
RUN chown -R daemon:daemon /usr/local/apache2/logs

EXPOSE 80

CMD ["httpd-foreground"]
