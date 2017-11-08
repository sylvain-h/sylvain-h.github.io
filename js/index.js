// Algolia client
var algolia = algoliasearch('3U8UBZBD6I', '54495e7b4dd2aa48f61d120c803ab7b6');

// Algolia Helper
var helper = algoliasearchHelper(algolia, 'restaurants', {
  facets: ['payment_options'],
  disjunctiveFacets: ['food_type'],
  hitsPerPage: 6,
  maxValuesPerFacet: 7
});

// Get location if possible
var geoloc;
if ("geolocation" in navigator) {
  // Geolocation is available
  navigator.geolocation.getCurrentPosition(function(position) {
    if (position) {
      geoloc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      // Update results according to location
      search();
    }
  });
}

// Bind the result event to a function that will update the results
helper.on("result", searchCallback);

// The different parts of the UI that we want to use in this example
var $searchInput = $('#search-input');
var $stats = $('#stats');
var $hits = $('#hits');
var facetHover = false;

$searchInput.on('keyup', search);

// Trigger a first search, so that we have a page with results
// from the start.
helper.search();

function search() {
  if (geoloc) {
    helper.setQuery($searchInput.val())
          .setQueryParameter('aroundLatLng', geoloc.lat + ',' + geoloc.lng)
          .search();
  } else {
    helper.setQuery($searchInput.val())
          .setQueryParameter('aroundLatLngViaIP', true)
          .search();
  }
}

// Result event callback
function searchCallback(results) {
  if (results.hits.length === 0) {
    // If there is no result we display a friendly message
    // instead of an empty page.
    $hits.empty().html("No results :(");
    return;
  }

	// Hits/results rendering
  $stats.html('<strong>' + results.nbHits + ' results</strong> in ' + results.processingTimeMS/1000 + ' seconds');
  renderHits($hits, results);
  if (facetHover != true) {
    renderFoodTypeList(results);
  }
  facetHover = false;
  renderPaymentOptionsList(results);
}

$('#show-more').on('click', function(e) {
  helper.nextPage();
  helper.search();
});

$('#food-type-list').on('click', 'a', function(e) {
  $(this).toggleClass('clicked');
});

$('#food-type-list').on('mouseenter mouseleave', 'a', function(e) {
  facetHover = true;
  var facetValue = $(this).data('facet');
  if (e.type == 'mouseleave' && !$(this).hasClass('clicked')) {
    helper.removeDisjunctiveFacetRefinement('food_type', facetValue)
          .search();
    $(this).removeClass('active');
  } else if (e.type == 'mouseenter' && !$(this).hasClass('clicked')) {
    helper.addDisjunctiveFacetRefinement('food_type', facetValue)
          .search();
    $(this).addClass('active');
  }
});

$('#rating-list').on('click', 'div', function(e) {
  var value = $(this).data('value');
  if ($(this).hasClass('active')) {
    $('div', '#rating-list').each(function() {
      $(this).removeClass('active');
    });
    helper.removeNumericRefinement('stars_count', '>=', value)
          .search();
    $(this).removeClass('active');
  } else {
    $('div', '#rating-list').each(function() {
      $(this).removeClass('active');
    });
    helper.clearRefinements('stars_count');
    helper.addNumericRefinement('stars_count', '>=', value)
          .search();
    $(this).addClass('active');
  }
});

$('#payment-options-list').on('click', 'a', function(e) {
  var facetValue = $(this).data('facet');
    if (facetValue == 'Diners Club' || facetValue == 'Carte Blanche' || facetValue == 'JCB') {
      helper.toggleFacetRefinement('payment_options', 'Discover')
            .toggleFacetRefinement('payment_options', 'Diners Club')
            .toggleFacetRefinement('payment_options', 'Carte Blanche')
            .toggleFacetRefinement('payment_options', 'JCB')
            .search();
    } else {
      helper.toggleFacetRefinement('payment_options', facetValue)
            .search();
    }
    $(this).toggleClass('active');
});

function renderHits($hits, results) {
  // Scan all hits and display them
  var hits = results.hits.map(function renderHit(hit) {
    // We rely on the highlighted attributes to know which attribute to display
    var highlighted = hit._highlightResult;
    var attributes =
          '<img src="' + hit.image_url + '" alt="Paris" class="picture">' +
          '<div class="restaurant-name">' + highlighted.name.value + '</div>' +
            '<div class="rating-line">' +
              '<span class="rating">' + parseFloat(Math.round(hit.stars_count * 10) / 10).toFixed(1) + '&nbsp;</span>' +
              '<div class="star-ratings-sprite active"><span style="width:' + hit.stars_count*20 + '%" class="star-ratings-sprite-rating"></span></div>' +
              '&nbsp;<span class="misc-info">(' + hit.reviews_count + ' reviews)</span>' +
            '</div>' +
          '<div class="misc-info">' + highlighted.food_type.value + ' | ' + highlighted.area.value + ' | ' + hit.price_range + '</div>';
    return '<div class="hit">' + attributes + '</div>';
  });
  if (results.page == 0) {
    $hits.html(hits);
  } else {
    $hits.append(hits);
  }

  if (results.nbPages > 1) {
    $('#show-more').show();
  } else {
    $('#show-more').hide();
  }
}

function renderFoodTypeList(results) {
  $('#food-type-list').html(function() {
    var facetValues = results.getFacetValues('food_type');
    return $.map(facetValues, function(facet) {
      var name = $('<span class="left">').html(facet.name);
      var count = $('<span class="right misc-info">').html(facet.count);
      var label = $('<a href="#">').append(name)
                          .append(count)
                          .data('facet', facet.name)
                          .attr('for', 'fl-' + facet.name);
      if(facet.isRefined) label.attr('class', 'active');
      return $('<li>').append(label);
    });
  });
}

function renderPaymentOptionsList(results) {
  var discoverCardFound = 0;
  $('#payment-options-list').html(function() {
    var facetValues = results.getFacetValues('payment_options');
    return $.map(facetValues, function(facet) {
      var displayName = facet.name;
      if (facet.name == 'Diners Club' || facet.name == 'Carte Blanche' || facet.name == 'JCB') {
        discoverCardFound++;
        if (discoverCardFound > 0) {
          return;
        }
        displayName = 'Discover';
      }
      var name = $('<span class="left">').html(displayName);
      var label = $('<a href="#">').append(name)
                          .data('facet', displayName)
                          .attr('for', 'fl-' + displayName);
      if(facet.isRefined) label.attr('class', 'active');
      return $('<li>').append(label);
    });
  });
}
