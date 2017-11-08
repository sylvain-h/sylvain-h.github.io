const fs = require('fs');
const csv = require("csvtojson");

var restaurants = JSON.parse(fs.readFileSync('../resources/dataset/restaurants_list.json', 'utf8'));

// Convert a csv file with csvtojson
csv({delimiter:';'})
  .fromFile('../resources/dataset/restaurants_info.csv')
  .on("end_parsed",function(csvRestaurants){ //when parse finished, result will be emitted here.
  
		csvRestaurants.forEach(function (csvRestaurant) {
			var fullRestaurant = restaurants.find(function(restaurant) {
				return restaurant.objectID == csvRestaurant.objectID;
			});
			if (fullRestaurant) {
				fullRestaurant.food_type = csvRestaurant.food_type;
				fullRestaurant.stars_count = parseFloat(csvRestaurant.stars_count);
				fullRestaurant.reviews_count = parseInt(csvRestaurant.reviews_count, 10);
				fullRestaurant.neighborhood = csvRestaurant.neighborhood;
				fullRestaurant.phone_number = csvRestaurant.phone_number;
				fullRestaurant.price_range = csvRestaurant.price_range;
				fullRestaurant.dining_style = csvRestaurant.dining_style;
			} else {
				console.log('Initial object not found, ID = ' + csvRestaurant.objectID); 
			}
		});
		
		fs.appendFile('restaurants_full.json', JSON.stringify(restaurants), function (err) {
		  if (err) throw err;
		  console.log('Restaurant information has been merged!');
		});
		
   });

