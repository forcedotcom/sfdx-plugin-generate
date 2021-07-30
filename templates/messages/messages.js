module.exports = {
  commandDescription: "print a greeting and your org IDs",
  nameFlagDescription: "name to print",
  forceFlagDescription: "example boolean flag",
  errorNoOrgResults: "No results found for the org '%s'.",
  example1: `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
My hub org id is: 00Dxx000000001234
  `,
  example2: `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
    `,
};
