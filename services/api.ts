

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:44381/api'; 

export async function fetchBilliardTableSessions() {
  try {
    const response = await fetch(`http://sportsapi.runasp.net/api/BilliardTable/GetAllBilliardTableActiveSessions`, {
   
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error; 
  }
}

//Start Game API Call
export async function startGame(tableId: number, playerName: string,gameStartedStaffName : string,createdBy:string) {

    try {
      const response = await fetch(`http://sportsapi.runasp.net/api/BilliardTable/StartGame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          playerName,
          gameStartedStaffName,
          createdBy
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error starting game: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  //End Game API Call
export async function endGame(tableId: number,totaltimeinminutes:Number,baseAmount:Number,additionalAmount:Number,
  totalAmount:Number,gameEndedStaffName:string,updatedBy:string) {
    try {
      const response = await fetch(`http://sportsapi.runasp.net/api/BilliardTable/EndGame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          totaltimeinminutes,
          baseAmount,
          additionalAmount,
          totalAmount,
          gameEndedStaffName,
          updatedBy,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Error starting game: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

