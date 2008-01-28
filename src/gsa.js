Gsa = Class.create({

  initialize: function(domain, options) {

    //required options
    if (domain == null)
      throw("'domain' argument required");

    //default parameters for the request
    this.options = $H({
      output: 'xml_no_dtd',
      proxystylesheet: 'json',
      client: 'json',
      site: 'default_collection'
    }).update(this.parseOptions(options));

    //set some properties based on the options
    this.domain = domain;
  },
  
  _request: function(url) {
    this.request = new Json.Request(url, { onComplete: this._response.bind(this) });
    (this.options.get('onSearch') || Prototype.emptyFunction)(this);
    (this.searchOptions.get('onSearch') || Prototype.emptyFunction)(this);
    return this.request;
  },
  
  _response: function () {
    this.results = new Gsa.Results(this.request.response);
    (this.options.get('onComplete') || Prototype.emptyFunction)(this);
    (this.searchOptions.get('onComplete') || Prototype.emptyFunction)(this);
    return this.results;
  },
  
  search: function (q, options) {
    if (q == null || q.blank())
      return false;
    this.searchOptions = $H();
    this.searchOptions.update(this.options);
    this.searchOptions.set('q', q);
    this.searchOptions.update(this.parseOptions(options));
    this._request(this.buildUri());
    return true;
  },
  
  parseOptions: function (options) {
    var options = $H(options);
    //sort
    if (!Object.isUndefined(options.get('sort'))) {
      var sort = options.get('sort');
      if (Object.isString(sort)) {
        options.set('sort',('date:' + sort.replace('date:','')));
      } else if (Object.isHash($H(sort))) {
        try {
          sort = $H(sort);
          var mode = (sort.get('mode') == 'date') ? 'S' : 'L';
          var direction = (sort.get('direction') == 'ascending') ? 'A' : 'D';
          options.set('sort','date:'+direction+':'+mode+':d1');
        } catch (e) {
          options.set('sort','date:D:L:d1');
        }
      }
    }
    //getfields
    if (!Object.isUndefined(options.get('getfields'))) {
      var getfields = options.get('getfields');
      if (!Object.isString(getfields) && Object.isArray(getfields)) {
        options.set('getfields', getfields.join('.'));
      }
    }
    //requiredfields
    if (!Object.isUndefined(options.get('requiredfields'))) {
      var requiredfields = $H(options.get('requiredfields'));
      if (Object.isHash(requiredfields)) {
        options.set('requiredfields', this.toFieldValues(requiredfields.get('fields'), requiredfields.get('mode')));
      }
    }
    //partialfields
    if (!Object.isUndefined(options.get('partialfields'))) {
      var partialfields = $H(options.get('partialfields'));
      if (Object.isHash(partialfields)) {
        options.set('partialfields', this.toFieldValues(partialfields.get('fields'), partialfields.get('mode')));
      }
    }
    return options;
  },
  
  buildUri: function () {
    var uriString = 'http://' + this.domain + '/search?' + this.searchOptions.toQueryString();
    return uriString;
  },
  
  toFieldValues: function (hash, mode) {
    hash = $H(hash);
    var joinstring;
    if (mode == 'OR') {
      joinstring = '|';
    } else {
      joinstring = '.';
    }
    return hash.map(function (pair){
      var key = pair.key, value = pair.value;
      return key + ':' + value;
    }).join(joinstring);
  }
});
