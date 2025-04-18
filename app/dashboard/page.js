"use client";

import { useEffect, useState } from "react";
import Header from '../component/Header/Header'
import styles from "./dashboard.module.css";


export default function Dashboard() {

  const [user, setUser] = useState(null);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);  
  const [profit, setProfit] = useState(0);
  const [tables, setTables] = useState([]);
  const [tableNumber, setTableNumber] = useState(""); // Pour la saisie du numéro de table
  const [isModalOpen, setIsModalOpen] = useState(false); // État pour la modale
  const [selectedTable, setSelectedTable] = useState(null); // Table sélectionnée pour la modale
  const [currentCategory, setCurrentCategory] = useState(null); // Catégorie de menu sélectionnée
  const [orders, setOrders] = useState({}); // Contient les commandes par table
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Modale pour catégories


  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedItemsToPay, setSelectedItemsToPay] = useState([]);

  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [sessionStartDate, setSessionStartDate] = useState(null); // Ajout de l'état pour la date de début de session

  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR");

  const [session, setSession] = useState();

const startSession = async (userId) => {
  try {
    const response = await fetch("/api/start-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId, session: session })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'ajout de la session");
    }
    setSession(session); // Update state with the new session
    console.log("Session ajoutée avec succès");
  } catch (error) {
    console.error("Erreur :", error);
  }
};

const addTableToSession = async (tableNumber) => {
  if (!user || !user.userId) {
    console.error("Utilisateur non identifié");
    return;
  }

  const table = {
    number : tableNumber,
    item :[]
  }

  setSession(table) 

  try {
    const response = await fetch("/api/update-session", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: user.userId,  })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour de la session");
    }

    console.log("Table ajoutée avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la table:", error);
  }
};



const addItemToTable = (tableNumber, item) => {
  // Trouve la table correspondant au numéro
  const table = sessionTest.table.find(table => table.number === tableNumber);
  
  if (table) {
    // Ajoute un item à la table
    const existingItem = table.item.find(order => order.name === item.name && order.status === "en cours");
    
    if (existingItem) {
      // Si l'item existe déjà, augmente la quantité
      existingItem.quantity += 1;
    } else {
      // Sinon, ajoute un nouvel item avec une quantité de 1
      table.item.push({
        name: item.name,
        price: item.price,
        quantity: 1,
        status: "en cours" // Définir comme "en cours" par défaut
      });
    }
  }
};

const calculateSessionTotal = () => {
  return sessionTest.table.reduce((total, table) => {
    const tableTotal = table.item.reduce((sum, item) => {
      return sum + (item.price * item.quantity); // Multiplie le prix par la quantité
    }, 0);
    return total + tableTotal;
  }, 0);
};


const updateUserSession = async () => {
  if (!user || !user.userId) {
    console.log("Utilisateur non défini :", user);  // Pour vérifier l'objet `user`
    console.error("Utilisateur non identifié");
    return;
  }

  try {
    console.log("Données envoyées dans la requête:", {
      userId: user.userId, 
      session: session
    });  // Vérification des données envoyées
    
    const response = await fetch("/api/update-session", {
      method: "PATCH",  // Vérifie que la méthode est bien PATCH
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId: user.userId, session: session })  // Envoi des données
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la mise à jour de la session");
    }

    console.log("Session mise à jour avec succès !");
  } catch (error) {
    console.error("Erreur :", error);
  }
};
  
  const openPaymentModal = () => {
    setSelectedItemsToPay([]); // Réinitialiser la sélection
    setIsPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };
  
  const toggleSelectItemToPay = (item) => {
    setSelectedItemsToPay((prevSelected) => {
      if (prevSelected.find((i) => i.id === item.id)) {
        return prevSelected.filter((i) => i.id !== item.id);
      } else {
        return [...prevSelected, item];
      }
    });
  };

  const handleQuantityChange = (item, quantity) => {
    setSelectedQuantities((prevQuantities) => ({
      ...prevQuantities,
      [item.id]: quantity > item.quantity ? item.quantity : Math.max(0, quantity),
    }));
  };
   
  const processPayment = (fullPayment = false) => {
    setOrders((prevOrders) => {
      let updatedOrders = { ...prevOrders };
  
      if (fullPayment) {
        delete updatedOrders[selectedTable];
      } else {
        updatedOrders[selectedTable] = prevOrders[selectedTable].flatMap((order) => {
          const quantityToPay = selectedQuantities[order.id] || 0;
  
          if (quantityToPay >= order.quantity) {
            return [];
          } else if (quantityToPay > 0) {
            return [{ ...order, quantity: order.quantity - quantityToPay }];
          }
          return [order];
        });
      }
  
      return updatedOrders;
    });
  
    if (fullPayment) {
      setTables((prevTables) => prevTables.filter((table) => table !== selectedTable));
    }
  
    setSelectedQuantities({}); // 🧹 Réinitialise les quantités sélectionnées
    closePaymentModal();       // 🔒 Ferme la modale
  };
  
  const boissons = [
    {name:"Coca-cola", price: 5},
    {name:"Soda", price: 4},
    {name:"Perrier", price: 3},
  ];

  const entrees = [
    {name:"Nems", price: 8},
    {name:"Samoussa", price: 10},
    {name:"Quiche", price: 5},
  ];

  const plats = [
    {name:"Tartare", price: 18},
    {name:"Dorade", price: 15},
    {name:"Rumsteak", price: 20},
  ];

  const desserts = [
    {name:"Crême catalane", price: 9},
    {name:"Tiramisu", price: 10},
    {name:"Mousse au chocolat", price: 7},
  ];

  const menus = [
    {name:"menu découverte", price: 18},
    {name:"Menu karaoké", price: 16},
    {name:"Menu fondue chinoise", price: 24},
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
      
      setDate(`${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`);
    }, 1000); 

    return () => clearInterval(interval); 
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/verify");  
        const data = await res.json();

        if (res.ok) {
          setUser(data.user);  
        } else {
          setUser(null);  
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token", error);
        setUser(null);
      } finally {
        setLoading(false);  
      }
    };

    fetchUserData(); 
  }, []);

  if (loading) {
    return <p>Chargement...</p>;
  }

  if (!user) {
    return <p>Accès refusé. Vous devez être connecté pour accéder à cette page.</p>;
  }

  const openTable = () => {
    const num = parseInt(tableNumber, 10);
    if (isNaN(num) || num < 1 || num > 50) {
      alert("Veuillez entrer un numéro de table valide entre 1 et 50.");
      return;
    }
    if (tables.includes(num)) {
      alert("Ce numéro de table est déjà pris.");
      return;
    }
    // Update the state and add to session
    const updatedTables = [...tables, num];
    setTables(updatedTables); // Update tables
    console.log(updatedTables)
    addTableToSession(num);   // Add the new table to session
  };
  
  const cancelTable = () => {
    const tableToCancel = prompt("Entrez le numéro de la table à annuler (entre 1 et 50) :");

    const num = parseInt(tableToCancel, 10);

    if (isNaN(num) || num < 1 || num > 50) {
      alert("Veuillez entrer un numéro de table valide.");
      return;
    }

    if (!tables.includes(num)) {
      alert("Cette table n'existe pas.");
      return;
    }

    const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir annuler la table ${num} ?`);

    if (isConfirmed) {
      setTables(tables.filter(table => table !== num)); // Supprime la table si confirmé
    }
  };

  const openModal = (table) => {
    setSelectedTable(table); // Met à jour la table sélectionnée
    setIsModalOpen(true); // Ouvre la modale
    setCurrentCategory(null); // Réinitialise la catégorie sélectionnée
  };

  const closeModal = () => {
    setIsModalOpen(false); // Ferme la modale
    setSelectedTable(null); // Réinitialise la table sélectionnée
  };

  const openCategoryModal = (category) => {
    setCurrentCategory(category);
    setIsCategoryModalOpen(true); // Ouvre la modale des catégories
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false); // Ferme la modale des catégories
  };

  const addItemToOrder = (item) => {
    setOrders(prevOrders => {
      const tableOrders = prevOrders[selectedTable] || [];
      
      // Chercher si l'élément existe déjà pour cette table avec ce statut
      const existingItemIndex = tableOrders.findIndex(order => order.name === item.name && order.status === "en cours");
  
      let updatedOrders;
  
      if (existingItemIndex !== -1) {
        // Si l'élément existe déjà, on augmente sa quantité
        updatedOrders = tableOrders.map((order, index) =>
          index === existingItemIndex
            ? { ...order, quantity: order.quantity + 1 }
            : order
        );
      } else {
        // Sinon, on ajoute un nouvel élément avec une quantité de 1
        const newItem = { 
          ...item, 
          id: `${item.name}-${new Date().getTime()}`, // ID unique pour chaque item
          quantity: 1, 
          status: "en cours"  // Par défaut, on commence avec "en cours"
        };
        updatedOrders = [...tableOrders, newItem];
      }
  
      return {
        ...prevOrders,
        [selectedTable]: updatedOrders,
      };
    });
  };
  
  const getCurrentCategoryItems = () => {
    switch (currentCategory) {
      case "boissons":
        return boissons;
      case "entrees":
        return entrees;
      case "plats":
        return plats;
      case "desserts":
        return desserts;
      case "menus":
        return menus;
      default:
        return [];
    }
  };

  const markAsServed = (item, table) => {
    setOrders(prevOrders => {
      const tableOrders = prevOrders[table] || [];
    
      // On met à jour l'élément si son statut est "en cours"
      const updatedOrders = tableOrders.map(order =>
        order.id === item.id && order.status === "en cours"
          ? { ...order, status: "servi" }  // On change le statut de "en cours" à "servi"
          : order
      );
    
      return {
        ...prevOrders,
        [table]: updatedOrders,  // Mise à jour de la commande de la table
      };
    });
  };
  
  const removeItemFromOrder = (item, table) => {
    const quantityToRemove = parseInt(prompt(`Combien de ${item.name} voulez-vous supprimer ? (Max: ${item.quantity})`), 10);
  
    if (isNaN(quantityToRemove) || quantityToRemove < 1 || quantityToRemove > item.quantity) {
      alert("Veuillez entrer un nombre valide.");
      return;
    }
  
    setOrders(prevOrders => {
      const tableOrders = prevOrders[table] || [];
      
      const updatedOrders = tableOrders
        .map(order =>
          order.name === item.name
            ? { ...order, quantity: order.quantity - quantityToRemove }
            : order
        )
        .filter(order => order.quantity > 0); // Supprimer les articles dont la quantité est 0
  
      return {
        ...prevOrders,
        [table]: updatedOrders,
      };
    });
  };

  const calculateTotal = () => {
    // On parcourt les commandes de la table sélectionnée
    const tableOrders = orders[selectedTable] || [];
    
    // On calcule le total en ajoutant le prix total de chaque item
    const total = tableOrders.reduce((sum, item) => {
      return sum + item.price * item.quantity; // Multiplie le prix par la quantité pour chaque item
    }, 0);
  
    return total;
  };
   
  return (
    <div className={styles.container}>
      <Header />
      <section className={styles.time}>
        <p>{date}</p>
        <p> C.A de la journée : {profit} </p>
        <p>{time}</p>
        {sessionStartDate && <p>Début du service : {sessionStartDate.toLocaleString()}</p>} {/* Afficher l'heure de début de session */}
      </section>
      <section className={styles.main}>
        <div className={styles.aside}>
          <button className={styles.startBtn} onClick={()=>startSession(user.userId)}> Démarrer session</button>
          <input 
            type="number" 
            value={tableNumber} 
            onChange={(e) => setTableNumber(e.target.value)} 
            placeholder="Numéro de table"
            className={styles.inputTable}
          />
          <button className={styles.mainBtn} onClick={openTable}> Ouvrir table</button>
          <button className={styles.mainBtn} onClick={cancelTable}> Annuler table </button>
          <button className={styles.mainBtn} onClick={updateUserSession}> Sauvegarder Session </button>
          <button className={styles.mainBtn}> Clôturer table </button>
          <button className= {styles.stopBtn} onClick={()=>updateUserSession(user.userId)}> Fermer session</button>
        </div>
        <div className={styles.table}>
          <div className={styles.panneau}>
            {tables
              .sort((a, b) => a - b)  // Trie les tables dans l'ordre croissant
              .map((table, index) => (
                <div 
                  key={index} 
                  className={styles.tableItem} 
                  onClick={() => openModal(table)} // Ouvre la modale au clic sur la table
                >
                  Table {table}
                </div>
              ))
            }
          </div>
        </div>
      </section>
      {/* Modale pour la table */}
      {isModalOpen && selectedTable !== null && (
        <div className={styles.tableModal}>
          <div className={styles.tableModalContent}>
            <button className={styles.closeBtn} onClick={closeModal}>X</button>
            <h3 className={styles.tableNumber}>Table {selectedTable}</h3>
            <div className={styles.commandeBox}>
  <div className={styles.commande}>
   
    {orders[selectedTable] && orders[selectedTable]
      .filter(item => item.status === "en cours")  // Filtrer les éléments en "en cours"
      .reduce((acc, item) => {
        // Regrouper les éléments par nom et additionner les quantités
        const existingItem = acc.find(order => order.name === item.name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [])  // Réduire pour regrouper les éléments
      .map((item) => (
        <div key={item.id} className={styles.itemCommande}>
          <span className={styles.itemName}>
            {item.name} (x{item.quantity})  {/* Affichage de la quantité totale */}
          </span> 
          <span className={styles.itemStatus} style={{ color: "red" }}>
            En cours...
            <button className={styles.btnServi} onClick={() => markAsServed(item, selectedTable)}>v</button>
          </span>
         
          <button
          className={styles.btnDelete}
          onClick={() => removeItemFromOrder(item, selectedTable)}
        >
          x
        </button>
          <span className={styles.itemPrice}>{item.quantity * item.price}€</span>
        </div>
      ))}
 
    {orders[selectedTable] && orders[selectedTable]
      .filter(item => item.status === "servi")  // Filtrer les éléments en "servi"
      .reduce((acc, item) => {
        // Regrouper les éléments par nom et additionner les quantités
        const existingItem = acc.find(order => order.name === item.name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({ ...item });
        }
        return acc;
      }, [])  // Réduire pour regrouper les éléments
      .map((item) => (
        <div key={item.id} className={styles.itemCommande}>
          <span className={styles.itemName}>
            {item.name} (x{item.quantity})  {/* Affichage de la quantité totale */}
          </span> 
          <span className={styles.itemStatus} style={{ color: "green" }}>
            Servi
          </span>
          <button
          className={styles.btnDelete}
          onClick={() => removeItemFromOrder(item, selectedTable)}
        >
          x
        </button>
          <span className={styles.itemPrice}>{item.quantity * item.price}€</span>
        </div>
      ))}
       <h3 className={styles.total}>  <strong>Total : <span className={styles.spanTotal}>{calculateTotal()}€</span></strong></h3>
              </div>
              <div className={styles.menuAside}>
                <button className={styles.btnTableModalValid} > VALIDER </button>
                <button className={styles.btnTableModal} onClick={() => openCategoryModal("boissons")}> BOISSONS </button>
                <button className={styles.btnTableModal} onClick={() => openCategoryModal("entrees")}> ENTREES </button>
                <button className={styles.btnTableModal} onClick={() => openCategoryModal("plats")}> PLATS </button>
                <button className={styles.btnTableModal} onClick={() => openCategoryModal("desserts")}> DESSERTS </button>
                <button className={styles.btnTableModal} onClick={() => openCategoryModal("menus")}> MENUS </button>
                <button className={styles.btnTableModalPay} onClick={openPaymentModal}> PAYER </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale pour la sélection des éléments d'une catégorie */}
      {isCategoryModalOpen && currentCategory && (
        <div className={styles.categoryModal}>
          <div className={styles.categoryModalContent}>
            <button className={styles.closeBtn} onClick={closeCategoryModal}>X</button>
            <h3 className={styles.categoryTitle}>{currentCategory.toUpperCase()}</h3>
            <div className={styles.categoryItems}>
              {getCurrentCategoryItems().map((item, index) => (
                <div key={index} className={styles.item} onClick={() => addItemToOrder(item)}>
                  <span>{item.name} - {item.price}€</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isPaymentModalOpen && (
        <div className={styles.paymentModal}>
          <div className={styles.paymentModalContent}>
            <button className={styles.closeBtn} onClick={closePaymentModal}>X</button>
            <h3 className={styles.paiementTitle}>Paiement de la Table {selectedTable}</h3>           
            <div className={styles.paymentItems}>
              {orders[selectedTable]?.map((item) => (
                <div key={item.id} className={styles.paymentItem}>
                  <span>{item.name} (x{item.quantity}) - {item.price * item.quantity}€</span>
                    <input
                      className={styles.paymentInput}
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={selectedQuantities[item.id] || ""}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value, 10) || 0)}
                    />
                </div>
              ))}
            </div>
            <div className={styles.paymentActions}>
              <button 
                className={styles.payFullBtn} 
                onClick={() => processPayment(true)}>Payer tout ({calculateTotal()}€)
              </button>
              <button 
                className={styles.paySelectedBtn} 
                onClick={() => processPayment(false)} 
                disabled={Object.values(selectedQuantities).every(q => q === 0)}
              >
                Payer la sélection ({Object.keys(selectedQuantities).reduce((sum, id) => {
                const item = orders[selectedTable]?.find(i => i.id === id);
                return sum + ((item?.price || 0) * (selectedQuantities[id] || 0));
                }, 0)}€)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}