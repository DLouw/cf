//If directed here from a "Get Quote" click. Open tool immediately
if(sessionStorage.getItem('wantsquote') == "true"){
    $("#quote-modal").modal("show");
    setTimeout(function(){
                $('.slider').slick("slickGoTo", 1);
                helpTimeline.play();
    }, 1000);
    sessionStorage.setItem('wantsquote', false);
}

//Create date variable to use on any new quotes
var date = new Date().toJSON().slice(0,10).replace(/-/g,'/');

function ProductViewModel(){
  
  var self = this;
  
//External subscriptions 
  
  //Subscribe to login changes
  loginPostman.subscribe(function(newVal){
    self.loginStatus(newVal);                   
  });
  self.loginStatus = ko.observable(false);
    
//    //Subscribe to settings changes
//   parameterPostman.subscribe(function(newVal){
//     self.parameters(newVal);
//   });
  
    self.parameters = ko.observable({cut_granite: 0,cut_marble: 0,cut_quartz: 0,delivery: 0,install_granite: 0,install_marble: 0,install_quartz: 0,splashback_width: 0,wastage: 0});
    
   //Get latest parameters
   $.getJSON('../serverside/getSettings.php', function(data){
     self.parameters(data[0]);
   });
      
//Quote Tool Observables
  
  //Product selected to get quote on
  //self.quoteProduct = ko.observable({name:"", brand:"", colour:"", stone:"", description: "", promo:"false", price_slab:0});
  
 //Variables entered by customer
 self.customerEmail = ko.observable("");
 self.customerName = ko.observable("");
 self.customerSurname = ko.observable("");
 self.customerNumber = ko.observable("");
 self.quoteDimensions = ko.observableArray([{length: ko.observable(0), width: ko.observable(0)}]);
 self.quoteDimensionString = ko.observable("");
 self.quoteSplashbacks = ko.observable(0);
 self.quoteCut = ko.observable(false);
 self.quoteInstall = ko.observable(true);
 self.quoteDate = ko.observable(date);
 self.quoteNumber = ko.observable(0); 
  
//Products Observables
  
  //Actual list of all products
//  self.products = ko.observableArray([{name:"", brand:"", colour:"", stone:"", description: "", promo:"false"}]);
  self.products = ko.observableArray();
  
  //Product currently being viewed/edited
    self.selectedProduct = ko.observable();    
                      
  //Products marked by user as favourite
  self.favourites = ko.observableArray(JSON.parse(localStorage.getItem('favourites'))); 

  //Filters
  self.typeFilter = ko.observableArray();
  self.typesAvailable = ko.observableArray(["Granite", "Marble", "Quartz"]);
  self.nameSort = ko.observable(true);
  self.priceSort = ko.observable(true);
  
//Computed functions
  
  //Area of all specified counter surfaces
  self.counterSqm = ko.computed(function(){
    var sqmm = 0;
    var sqm = 0;
    var dimstring = "";  
      
    if((self.quoteDimensions()[0].length()>0)&&(self.quoteDimensions()[0].width()>0)){
        
      ko.utils.arrayForEach(self.quoteDimensions(), function(dim){
        if((dim.length() > 0)&&(dim.width()>0)){
            sqmm += dim.length()*dim.width();         
            dimstring += dim.length() + ' x ' + dim.width() + ', '; 
         }
      });
      
      sqm = sqmm/1000000;

      if(sqm < 2){
          sqm = 2;
      }

      //Also update the dimension string that willl be supplied to admin for further info
      dimstring = dimstring.replace(/(^\s*,)|(,\s*$)/g, '');
      self.quoteDimensionString(dimstring); 
    }
    
    return sqm; 
    
  });
      
  //Area of splashbacks
  self.splashSqm = ko.computed(function(){
    var splash = 0;
    splash = (self.quoteSplashbacks() * self.parameters().splashback_width)/1000000;
    return  splash;
  });
  
  //Area of total material needed
  self.totalSqm = ko.computed(function(){
    return self.counterSqm() + self.splashSqm();
  });
  
  //Area of total material adjusted for wastage
  self.adjustedTotalSqm = ko.computed(function(){
    return self.totalSqm() / ((100-parseInt(self.parameters().wastage))/100 );
  });

  
//Quote Functions
  
  //Add/remove line for dimensions
  self.addDimension = function(){
    self.quoteDimensions.unshift({length: ko.observable(1), width: ko.observable(1)}); 
  }
  self.removeDimension = function(){
    if(self.quoteDimensions().length > 1){
      self.quoteDimensions.shift(); 
    }
  }
  
  //Select product for quote
  self.getQuote = function(product){
      if(self.counterSqm()>0){
        self.selectedProduct(product);
        $("#quote-modal").modal("show");
        $('.slider').slick("setPosition", 0);
        setTimeout(function(){
              $('.slider').slick("slickGoTo", 7);
          }, 1000);
      }
  };
  
  //Check if customer has already specified some sizes
  self.hasProjectDetails = ko.computed(function(){
     if(self.counterSqm() != 0){
         return true
     } else{
         return false
     }
  });
  
  self.sendQuote = function(){
    
    var data=JSON.stringify({
      email: self.customerEmail(),
      admin_email: self.parameters().admin_email,
      name: self.customerName(),
      surname: self.customerSurname(),
      number: self.customerNumber(),
      product_id: self.selectedProduct().product_id(),
      product_name: self.selectedProduct().name(),
      area: self.counterSqm(),
      dimension: self.quoteDimensionString(),
      splashbacks: self.quoteSplashbacks(),
      cut : self.quoteCut(),
      install: self.quoteInstall(),
      date: self.quoteDate(),
      material_cost: self.selectedProduct().materialCost(),
      service_cost: self.selectedProduct().serviceCost(),
      total_cost: self.selectedProduct().calculatedCost()          
    });
      
    var url = "serverside/addQuote.php";
      
    $.ajax({
        type: "POST",
        url: url,
        data: data,
        dataType: "json",
        contentType: false,
        cache: false,
        processData:false,
        success: function(data)
        {
          if(data.type == "success"){
            self.quoteNumber(data.message);
            //Wait 2sec sec, then move the slider along
            setTimeout(function(){
              $('#quote-modal .slider').slick("slickNext");
            }, 2000);
          } else{
            console.log("Quote error");
          }
        }
    });
    
  }    
    
//Product Functions
  
  //Get products from DB
  self.loadProducts = function(){
    $.getJSON("../serverside/getProducts.php", function(data) {
        self.products.removeAll();
        data.forEach(function(product) {
          //console.log(product);
          for (var attr in product){
            product[attr] = ko.observable(product[attr]);
          }
          //Add observable properties that will be needed later
          product["show"] = ko.observable(true);
          product["calculatedCost"] = ko.observable(0);
          product["materialCost"] = ko.observable(0);
          product["serviceCost"] = ko.observable(0);
          self.products.push(product);
        });
        
//        ko.utils.arrayForEach(self.products(), function(prod) {
//
//            prod.name("MashPotatoes");
//      });
//    
        
      });
  }
  self.loadProducts();
    
  //Add/remove stone type to filter
  self.toggleTypeFilter = function(name){
      //Add the filter keyword, or remove if it is already in the activeFilter array
      var pos = self.typeFilter.indexOf(name);
      if(pos == -1){
          self.typeFilter.push(name);
      } else{
          self.typeFilter.remove(name);
      }
  }
  
  //Re-organise products if the filter changes
//  self.typeFilter.subscribe(function(){
//      ko.utils.arrayForEach(self.products(), function(product){
//        var pos = self.typeFilter.indexOf(product()["stone"]);
//        if ((self.typeFilter.indexOf(prod['stone']())>-1)||(self.typeFilter().length == 0)){
//            prod['show']("false");
//        } else{
//            prod['show']("true");
//        }
//      });
//  })
  
  //Re-organise if sorting parameters change
//  self.nameSort.subscribe(function(){
//      //Sort based on name direction
//      ko.utils.arraySort(function(left,right){
//        var order;
//
//        if (self.nameSort()){
//          order = left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
//        } 
//        else{
//          order = left.name == right.name ? 0 : (left.name > right.name ? -1 : 1);
//        }
//        return order;
//      });
//  })
  
  //Re-organise if sorting parameters change
//  self.priceSort.subscribe(function(){
//      //Sort based on name direction
//      ko.utils.priceSort(function(left,right){
//        var order;
//
//        if (self.priceSort()){
//          order = left.calculatedCost == right.calculatedCost ? 0 : (left.calculatedCost < right.calculatedCost ? -1 : 1);
//        } 
//        else{
//          order = left.calculatedCost == right.calculatedCost ? 0 : (left.calculatedCost > right.calculatedCost ? -1 : 1);
//        }
//        return order;
//      });
//  })
    
  //Open detailed view modal
  self.selectProduct = function(product){
    self.selectedProduct(product);
   }
  
  //Computed to calculate costs if parameters change
//  ko.computed(function(){
//    
//      //Finally, calculate costs based on quote tool square meters
//      ko.utils.arrayForEach(self.products(), function(element){
//
//         var cutCost;
//         var installCost;
//
//         switch(element.stone){
//           case 'Granite':
//             cutCost = self.parameters().cut_granite;
//             installCost = self.parameters().install_granite;
//             break;
//          case 'Marble':
//             cutCost = self.parameters().cut_marble;
//             installCost = self.parameters().install_marble;
//             break;
//          case 'Quartz':
//             cutCost = self.parameters().cut_quartz;
//             installCost = self.parameters().install_quartz;
//             break;
//         }
//
//         var serviceCost = cutCost*self.quoteCut()*self.totalSqm() + installCost*self.quoteInstall()*self.totalSqm() + self.quoteInstall()*self.parameters().delivery;
//
//         var materialCost = self.adjustedTotalSqm()*element.price_sqm;
//
//        element.calculatedCost = Math.round(serviceCost + materialCost); 
//        element.serviceCost = serviceCost;
//        element.materialCost = materialCost;
//        
//        //console.log(element);
//      });
//    
//  });
    
//Main computed to manage product gallery display
 ko.computed(function(){ 
    
      //Make sure we update quoted numbers to change
      var area = self.totalSqm();
      var cut = self.quoteCut();
      var install = self.quoteInstall();
    
      ko.utils.arrayForEach(self.products(), function(prod) {

          
        if ((self.typeFilter.indexOf(prod.stone())>-1)||(self.typeFilter().length == 0)){
            prod.show(true);
        } else{
            prod.show(false);
        }
      });
     
     //console.log(self.products());
      

      //Sort based on name direction
      self.products.sort(function(left,right){
        var order;

        if (self.nameSort()){
          order = left.name() == right.name() ? 0 : (left.name() < right.name() ? -1 : 1);
        } 
        else{
          order = left.name() == right.name() ? 0 : (left.name() > right.name() ? -1 : 1);
        }

        return order;
      });

      //Finally, calculate costs based on quote tool square meters
      ko.utils.arrayForEach(self.products(), function(element){

         var cutCost;
         var installCost;

         switch(element.stone()){
           case 'Granite':
             cutCost = self.parameters().cut_granite;
             installCost = self.parameters().install_granite;
             break;
          case 'Marble':
             cutCost = self.parameters().cut_marble;
             installCost = self.parameters().install_marble;
             break;
          case 'Quartz':
             cutCost = self.parameters().cut_quartz;
             installCost = self.parameters().install_quartz;
             break;
         }

         var serviceCost = cutCost*self.quoteCut()*self.totalSqm() + installCost*self.quoteInstall()*self.totalSqm() + self.quoteInstall()*self.parameters().delivery;

         var materialCost = self.adjustedTotalSqm()*element.price_sqm();

        element.calculatedCost(Math.round(serviceCost + materialCost)); 
        element.serviceCost(Math.round(serviceCost));
        element.materialCost(Math.round(materialCost));
        
      });
   
//      Sort based on price direction
      self.products.sort(function(left,right){
        var order;

        if (self.priceSort()){
          order = left.price_sqm() == right.price_sqm() ? 0 : (left.price_sqm() < right.price_sqm() ? -1 : 1);
        } 
        else{
          order = left.price_sqm() == right.price_sqm() ? 0 : (left.price_sqm() > right.price_sqm() ? -1 : 1);
        }

        return order;
      });


  });

//OLD COMPUTED
//  ko.computed(function(){ 
//    
//      //Make sure we update quoted numbers to change
//      var area = self.totalSqm();
//      var cut = self.quoteCut();
//      var install = self.quoteInstall();
//    
//      var temp = ko.utils.arrayFilter(self.products(), function(prod) {
//
//        if ((self.typeFilter.indexOf(prod['stone'])>-1)||(self.typeFilter().length == 0)){
//            return true;
//        } else{
//            return false;
//        }
//      });
//      
//    ko.utils.arrayForEach(self.products(), function(prod) {
//
//        if ((self.typeFilter.indexOf(prod['stone'])>-1)||(self.typeFilter().length == 0)){
//            return true;
//        } else{
//            return false;
//        }
//      });
//    
//    
//      //Sort based on name direction
//      temp.sort(function(left,right){
//        var order;
//
//        if (self.nameSort()){
//          order = left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
//        } 
//        else{
//          order = left.name == right.name ? 0 : (left.name > right.name ? -1 : 1);
//        }
//
//        return order;
//      });
//
//
//
//      //Finally, calculate costs based on quote tool square meters
//      temp.forEach(function(element){
//
//         var cutCost;
//         var installCost;
//
//         switch(element.stone){
//           case 'Granite':
//             cutCost = self.parameters().cut_granite;
//             installCost = self.parameters().install_granite;
//             break;
//          case 'Marble':
//             cutCost = self.parameters().cut_marble;
//             installCost = self.parameters().install_marble;
//             break;
//          case 'Quartz':
//             cutCost = self.parameters().cut_quartz;
//             installCost = self.parameters().install_quartz;
//             break;
//         }
//
//         var serviceCost = cutCost*self.quoteCut()*self.totalSqm() + installCost*self.quoteInstall()*self.totalSqm() + self.quoteInstall()*self.parameters().delivery;
//
//         var materialCost = self.adjustedTotalSqm()*element.price_sqm;
//
//        element.calculatedCost = Math.round(serviceCost + materialCost); 
//        element.serviceCost = serviceCost;
//        element.materialCost = materialCost;
//        
//        //console.log(element);
//      });
//    
//      Sort based on price direction
//      temp.sort(function(left,right){
//        var order;
//
//        if (self.priceSort()){
//          order = left.calculatedCost == right.calculatedCost ? 0 : (left.calculatedCost < right.calculatedCost ? -1 : 1);
//        } 
//        else{
//          order = left.calculatedCost == right.calculatedCost ? 0 : (left.calculatedCost > right.calculatedCost ? -1 : 1);
//        }
//
//        return order;
//      });
//
//
//    return temp.slice();
//
//  });
  
  //Clear all filters and display all
  self.clearFilters = function(){
    self.typeFilter([]);
  }
    
  //Add/remove product form favourites
  self.toggleFavourites = function(product){
    //Toggle product in favourites
    var pos = self.favourites.indexOf(product.name);
    if (pos == -1){
      self.favourites.push(product.name);
    } else{
      self.favourites.remove(product.name);
    }
    //Store favourites in localstorage 
    localStorage.setItem('favourites', JSON.stringify(self.favourites()));
  }

  // Updating a product
  self.postProduct = function(form) {
          alertPostman.notifySubscribers("Updating products...");
          var url = "serverside/addProduct.php";
          // POST values in the background the the script URL
          $.ajax({
              type: "POST",
              url: url,
              data: new FormData(form),
              dataType: "json",
              contentType: false,
              cache: false,
              processData:false,
              success: function(data)
              {

                if(data.type == "success"){
                  alertPostman.notifySubscribers("Products updated succesfully");
                  $('#product-form')[0].reset();
//                    self.products.remove(self.selectedProduct());
//                    self.products.push(data.message);
                      self.loadProducts();
                } 
                else{
                  alertPostman.notifySubscribers(data.message);
                }
              }
          });
  };
  
    // Adding a product
  self.addProduct = function(form) {
          alertPostman.notifySubscribers("Adding new product...");
          var url = "serverside/addProduct.php";
          // POST values in the background the the script URL
          $.ajax({
              type: "POST",
              url: url,
              data: new FormData(form),
              dataType: "json",
              contentType: false,
              cache: false,
              processData:false,
              success: function(data)
              {

                if(data.type == "success"){
                  alertPostman.notifySubscribers("Products added succesfully");
//                      $('#productAddForm')[0].reset();
//                    self.products.remove(self.selectedProduct());
//                    self.products.push(data.message);
                      self.loadProducts();
                } 
                else{
                  alertPostman.notifySubscribers(data.message);
                }
              }
          });
  };
    // Removing a product
  self.deleteProduct = function(product){
      alertPostman.notifySubscribers("Removing Product...");
      $.ajax({
        url:"../serverside/removeProduct.php",
        type: 'post',
        data: product,
        success: function(data){
          if(data.type == "success"){
              self.products.remove(product);
              alertPostman.notifySubscribers("Product removed from database");
          }
        }
      });
  }
  //Opens product in editor
  self.editProduct = function(product){
    if(product.promo() == 'true'){
      product.promo(true);
    }
    else{
      product.promo(false);
    }
    self.selectedProduct(product);
    $("#productAdminmodal").modal("show");
  };
  //Open product add modal
  self.addProduct = function(product){
    $('#productAddForm')[0].reset();
    $("#productAddModal").modal("show");
  };
  
    //Open product add modal
  self.viewProduct = function(product){
    self.selectedProduct(product);
    $("#productModal").modal("show");
  };
  
};

//ko.applyBindings(new ProductViewModel());
ko.applyBindings(new ProductViewModel(), document.getElementById("productArea"));