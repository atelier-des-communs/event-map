from flask_assets import Bundle

app_css = Bundle('app.scss', filters='scss', output='styles/app.css')

app_js = Bundle('app.js', filters='jsmin', output='scripts/app.js')

vendor_css = Bundle(
    output='styles/vendor.css')

vendor_js = Bundle(
    'vendor/tablesort.min.js',
    'vendor/location-picker.js', 
    filters='jsmin',
    output='scripts/vendor.js')
