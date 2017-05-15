\c scoutfix;

/*CREATE TABLE vehicle (
 ID serial NOT NULL PRIMARY KEY,
 data json NOT NULL
);
*/

/*
CREATE TABLE estimate (
 ID serial NOT NULL PRIMARY KEY,
 data json NOT NULL
);
*/

/*
CREATE TABLE IF NOT EXISTS QuoteItem (
  idQuoteItem serial PRIMARY KEY not null,
  fk_Quote_idQuote integer REFERENCES Quote (idQuote) not null,
  fk_Zipcode_zipcodeNum integer REFERENCES Zipcode (zipcodeNum) not null,
  fk_Service_idService integer REFERENCES Service (idService) not null,
  jk_Vehicle_trimID VARCHAR(45) NOT NULL,
  jk_Estimate_estimatePrice VARCHAR(45)
    );

INSERT INTO QuoteItem (fk_Quote_idQuote, fk_Zipcode_zipcodeNum, fk_Service_idService, jk_Vehicle_trimID, jk_Estimate_estimatePrice)
    VALUES(1, 11435, 409, 900, 4545);
*/
/*
SELECT * FROM json_test WHERE data ?| array['makes'];
"SELECT * FROM vehicle WHERE data ?| array['makes']"

select data->'makes'->0->'makename' from vehicle;
select data->'makes'->0-> from vehicle;
*/

/*
CREATE TABLE IF NOT EXISTS NewEstimate (
    idNewEstimate serial PRIMARY KEY not null,
    estimateName varchar(45) not null,
    fk_Zipcode_zipcodeNum integer REFERENCES Zipcode (zipcodeNum) not null,
    fk_Service_idService integer REFERENCES Service (idService) not null,
    trimID INT NOT NULL,
    estimateLow INT,
    estimateHigh INT,
    estimateLaborLow INT,
    estimateLaborHigh INT,
    estimatePartLow INT,
    estimatePartHigh INT
);

INSERT INTO NewEstimate (estimateName, fk_Zipcode_zipcodeNum, fk_Service_idService, trimID, estimateLow, estimateHigh, estimateLaborLow, estimateLaborHigh, estimatePartLow, estimatePartHigh)
    VALUES('electric fixing', 11435, 409, 5000, 4400, 6400, 4000, 6000, 1000, 400);
*/

INSERT INTO QuoteItem (fk_Quote_idQuote, fk_Zipcode_zipcodeNum, fk_Service_idService, ne_Vehicle_trimID, fk_NewEstimate_idNewEstimate)
    VALUES(1, 11435, 409, 900, 2);


