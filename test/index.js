function test(name, path) {
    describe(name, function () {
        require(path);
    })
}


describe('#bateeq-module', function (done) {
    this.timeout(10000 * 60000);

    // test('@auth/role-manager', './auth/role-manager-test'); 
    // test('@manager/master/item-manager', './managers/master/item-manager-test');
    // test('@manager/master/material-manager', './managers/master/material-manager-test');
    // test('@manager/master/finished-goods-manager', './managers/master/finished-goods-manager-test');

    // test('@manager/article-brand-manager', './managers/article-brand-manager-test');
    // test('@manager/article-category-manager', './managers/article-category-manager-test');
    // test('@manager/article-counter-manager', './managers/article-counter-manager-test');
    // test('@manager/article-material-manager', './managers/article-material-manager-test');
    // test('@manager/article-motif-manager', './managers/article-motif-manager-test');
    // test('@manager/article-origin-manager', './managers/article-origin-manager-test');
    // test('@manager/article-season-manager', './managers/article-season-manager-test');
    // test('@manager/article-sub-counter-manager', './managers/article-sub-counter-manager-test');
    // test('@manager/article-theme-manager', './managers/article-theme-manager-test');
    // test('@manager/article-type-manager', './managers/article-type-manager-test');
    // test('@manager/article-manager', './managers/article-manager-test'); 

    // test('@manager/storage-manager', './managers/storage-manager-test'); 
    // test('@manager/store-manager', './managers/store-manager-test');
    // test('@manager/supplier-manager', './managers/supplier-manager-test');
    // test('@manager/transfer-in-doc-manager', './managers/transfer-in-doc-manager-test');
    // test('@manager/transfer-in-store-business', './business/store/transfer-in-store-business-test');
    // test('@manager/transfer-out-doc-manager', './managers/transfer-out-doc-manager-test');
    // test('@manager/transfer-in-doc-ext-manager', './managers/transfer-in-doc-ext-manager-test');
    // test('@manager/inventory-manager', './managers/inventory-manager-test');
    // test('@manager/module-manager', './managers/module-manager-test');

    // test('@manager/efr-kb-rtt-manager', './managers/efr-kb-rtt-manager-test');
    // test('@manager/efr-kb-fng-manager', './managers/efr-kb-fng-manager-test');
    // test('@manager/efr-kb-rtp-manager', './managers/efr-kb-rtp-manager-test');
    // test('@manager/efr-kb-rtf-manager', './managers/efr-kb-rtf-manager-test'); 
    // test('@manager/efr-kb-rtd-manager', './managers/efr-kb-rtd-manager-test');
    // test('@manager/efr-tb-act-manager', './managers/efr-tb-act-manager-test');
    // test('@manager/efr-tb-bat-manager', './managers/efr-tb-bat-manager-test');
    // test('@manager/efr-tb-bbt-manager', './managers/efr-tb-bbt-manager-test');
    // test('@manager/efr-tb-bjb-manager', './managers/efr-tb-bjb-manager-test');
    // test('@manager/efr-tb-bjr-manager', './managers/efr-tb-bjr-manager-test');
    // test('@manager/efr-tb-brd-manager', './managers/efr-tb-brd-manager-test');
    // test('@manager/efr-tb-brt-manager', './managers/efr-tb-brt-manager-test'); 
    // test('@manager/efr-tb-sab-manager', './managers/efr-tb-sab-manager-test');
    // test('@manager/efr-pk-pbj-manager', './managers/efr-pk-pbj-manager-test');
    // test('@manager/efr-pk-pba-manager', './managers/efr-pk-pba-manager-test');
    // test('@manager/efr-pk-pbr-manager', './managers/efr-pk-pbr-manager-test'); 
    // test('@manager/efr-tb-sab-manager', './managers/efr-tb-sab-manager-test');
    // test('@manager/efr-kb-exb-manager', './managers/efr-kb-exb-manager-test');
    // test('@manager/efr-hp-fng-manager', './managers/efr-hp-fng-manager-test'); 

    // test('@manager/bank-manager', './managers/bank-manager-test'); 
    // test('@manager/card-type-manager', './managers/card-type-manager-test'); 
    // test('@manager/promo-manager', './managers/promo-manager-test');


    // test("@etl/dim-branch", "./etl/dim-branch");
    // test("@etl/fact-penjualan", "./etl/fact-penjualan");
    // test("@etl/fact-penjualan-summary", "./etl/fact-penjualan-summary");
    test("@etl/dim-time", "./etl/dim-time");



    // test("@etl/sales-migration-etl", "./etl/sales-data-etl-test");
    // test("@etl/items-migration-etl", "./etl/items-migration-etl-test");
    //2nd






    // test("@etl/storages-migration-etl", "./etl/storages-migration-etl-test");
    //1st
    // test("@etl/stores-migration-etl", "./etl/stores-migration-etl-test");
    // test("@etl/testPaging-etl", "./etl/pagination-etl-test");

    // test("@etl/item-etl", "./etl/items-etl-pagination-test");
    // test("@etl/sp-item-etl", "./etl/items-etl-pagination-test");
    // test("@etl/sales-etl", "./etl/sales-etl-pagination-test");
    // test("@etl/sp-sales-etl", "./etl/sp-sales-etl-test");

    //new unit test 
    //auth
    // test('@auth/account-manager', './auth/account-manager-test'); 
    // test('@auth/role-manager', './auth/role-manager-test');

    // //master
    // test('@managers/master/material', './managers/master/material');
    // test('@managers/master/module', './managers/master/module');
    // test('@managers/master/storage', './managers/master/storage');
    // test('@managers/master/store', './managers/master/store');
    // test('@managers/master/supplier', './managers/master/supplier');
    // test("@managers/master/bank", "./managers/master/bank");
    // test("@managers/master/card-type", "./managers/master/card-type");
    // test("@managers/master/finished-goods", "./managers/master/finished-goods");
    // test("@managers/master/item", "./managers/master/item");
   // test("@managers/master/division", "./managers/master/division");
    //test('@managers/master/unit", "./managers/master/unit');

    // // //transaction
    // // test('@manager/sales-manager', './managers/sales-manager-test');
    // // test('@manager/sales-return-manager', './managers/sales-return-manager-test');
    // //test('@manager/efr-tb-bat-manager', './managers/efr-tb-bat-manager-test');
    // // test('@manager/efr-tb-bbt-manager', './managers/efr-tb-bbt-manager-test');
    // //test('@manager/efr-kb-rtp-manager', './managers/efr-kb-rtp-manager-test');
    // //  test("@etl/storages-migration-etl", "./etl/storages-migration-etl-test"); 



})