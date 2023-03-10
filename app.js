const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, product.db);

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on Port:3000");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (obj) => {
  return {
    productId: obj.product_id,
    quantity: obj.quantity,
  };
};

app.get("/products/", async (request, response) => {
  const getAllProductsQuery = `
        SELECT *
        FROM product;
    `;
  const dbResponse = await db.all(getAllProductsQuery);
  const responseArr = dbResponse.map((eachItem) =>
    convertDbObjectToResponseObject(eachItem)
  );
  response.send(responseArr);
});

app.post("/products/", async (request, response) => {
  const payLoad = request.body;

  payLoad.forEach(async (eachItem) => {
    try {
      const { productId, quantity, operation } = eachItem;

      const checkIfProductExistsQuery = `
                SELECT * FROM product WHERE product_id=${productId}
            `;

      const dbResp1 = await db.get(checkIfProductExistsQuery);

      if (dbResp1 === undefined) {
        if (operation === "add") {
          const createProductQuery = `
                        INSERT INTO product(product_id,quantity)
                        VALUES(${productId},${quantity})
                    `;
          const dbResp2 = await db.run(createProductQuery);
          console.log("New Product Created Successfully");
        } else {
          console.log("No such product(s) exits to remove");
        }
      } else {
        if (operation === "add") {
          const updateProductQuery = `
                        UPDATE product
                        SET quantity = quantity + ${quantity}
                        WHERE product_id=${productId}
                    `;
          const dbResp = await db.run(updateProductQuery);
          console.log("New quantity updated after addition");
        } else {
          const checkForQuantity = `
                        SELECT * FROM product WHERE product_id=${productId}
                    `;
          const dbResp1 = await db.get(checkForQuantity);

          if (dbResp1.quantity - quantity >= 0) {
            const updateProductQuantityQuery = `
                            UPDATE product
                            SET quantity=quantity=${quantity}
                            WHERE product_id=productId
                        `;
            const dbResp2 = await db.run(updateProductQuantityQuery);
            console.log("New Quantity updated successfully after subtraction");
          } else {
            console.log(
              "Negative value i.e, existing quantity lower than expected qauntity"
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  response.send("Operations carried out successfully");
});
