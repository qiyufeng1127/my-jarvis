import React, { useState } from 'react';
import { usePetStore, PetType } from '@/stores/petStore';
import { useGoldStore } from '@/stores/goldStore';

export const PetShop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pets' | 'food' | 'toys'>('pets');
  
  const { 
    shopItems, 
    ownedPets, 
    foods, 
    toys,
    adoptPet, 
    feedPet,
    playWithPet,
    canAdoptPet,
  } = usePetStore();
  
  const { balance } = useGoldStore();

  const petItems = shopItems.filter(item => item.type === 'pet');
  const foodItems = shopItems.filter(item => item.type === 'food');
  const toyItems = shopItems.filter(item => item.type === 'toy');

  const handleAdoptPet = (type: PetType) => {
    if (!canAdoptPet()) {
      alert('最多只能拥有5只宠物！');
      return;
    }

    const name = prompt('给你的宠物起个名字：');
    if (name && name.trim()) {
      const success = adoptPet(type, name.trim());
      if (success) {
        alert(`🎉 成功领养宠物: ${name}`);
      } else {
        alert('❌ 金币不足，无法领养宠物');
      }
    }
  };

  const handleBuyFood = (foodId: string) => {
    const success = feedPet(foodId);
    if (success) {
      alert('🍖 喂食成功！');
    } else {
      alert('❌ 金币不足或没有宠物');
    }
  };

  const handleBuyToy = (toyId: string) => {
    const success = playWithPet(toyId);
    if (success) {
      alert('🎾 玩耍成功！');
    } else {
      alert('❌ 金币不足或没有宠物');
    }
  };

  return (
    <div className="pet-shop">
      <div className="shop-header">
        <h3>🏪 宠物商店</h3>
        <div className="balance">
          💰 余额: <span className="amount">{balance}</span>
        </div>
      </div>

      {/* 标签页 */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pets' ? 'active' : ''}`}
          onClick={() => setActiveTab('pets')}
        >
          🐾 宠物 ({ownedPets.length}/5)
        </button>
        <button
          className={`tab ${activeTab === 'food' ? 'active' : ''}`}
          onClick={() => setActiveTab('food')}
        >
          🍖 食物
        </button>
        <button
          className={`tab ${activeTab === 'toys' ? 'active' : ''}`}
          onClick={() => setActiveTab('toys')}
        >
          🎾 玩具
        </button>
      </div>

      {/* 商品列表 */}
      <div className="shop-content">
        {activeTab === 'pets' && (
          <div className="items-grid">
            {petItems.map((item) => {
              const isOwned = ownedPets.some(p => p.type === item.data?.type);
              const canAfford = balance >= item.price;
              
              return (
                <div key={item.id} className={`shop-item ${isOwned ? 'owned' : ''}`}>
                  <div className="item-emoji">{item.emoji}</div>
                  <div className="item-name">{item.name}</div>
                  <div className="item-description">{item.description}</div>
                  <div className="item-price">💰 {item.price}</div>
                  
                  {isOwned ? (
                    <button className="btn-owned" disabled>
                      ✅ 已拥有
                    </button>
                  ) : (
                    <button
                      className="btn-buy"
                      onClick={() => handleAdoptPet(item.data.type)}
                      disabled={!canAfford || !canAdoptPet()}
                    >
                      {canAfford ? '领养' : '金币不足'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'food' && (
          <div className="items-grid">
            {foods.map((food) => {
              const canAfford = balance >= food.price;
              
              return (
                <div key={food.id} className="shop-item">
                  <div className="item-emoji">{food.emoji}</div>
                  <div className="item-name">{food.name}</div>
                  <div className="item-stats">
                    <span>🍖 +{food.hungerRestore}</span>
                    <span>😊 +{food.happinessBonus}</span>
                  </div>
                  <div className="item-price">💰 {food.price}</div>
                  
                  <button
                    className="btn-buy"
                    onClick={() => handleBuyFood(food.id)}
                    disabled={!canAfford}
                  >
                    {canAfford ? '购买并喂食' : '金币不足'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'toys' && (
          <div className="items-grid">
            {toys.map((toy) => {
              const canAfford = balance >= toy.price;
              
              return (
                <div key={toy.id} className="shop-item">
                  <div className="item-emoji">{toy.emoji}</div>
                  <div className="item-name">{toy.name}</div>
                  <div className="item-stats">
                    <span>😊 +{toy.happinessBonus}</span>
                  </div>
                  <div className="item-price">💰 {toy.price}</div>
                  
                  <button
                    className="btn-buy"
                    onClick={() => handleBuyToy(toy.id)}
                    disabled={!canAfford}
                  >
                    {canAfford ? '购买并使用' : '金币不足'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .pet-shop {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .shop-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
        }

        .shop-header h3 {
          font-size: 1.5rem;
          color: #333;
          margin: 0;
        }

        .balance {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .balance .amount {
          color: #ff9800;
          font-size: 1.3rem;
        }

        .tabs {
          display: flex;
          background: #f5f5f5;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .tab.active {
          background: white;
          border-bottom: 3px solid #ff9800;
          font-weight: 600;
        }

        .shop-content {
          padding: 1.5rem;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .shop-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          background: #f9f9f9;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .shop-item:hover {
          border-color: #ff9800;
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
        }

        .shop-item.owned {
          background: #e8f5e9;
          border-color: #4CAF50;
        }

        .item-emoji {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .item-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .item-description,
        .item-stats {
          font-size: 0.85rem;
          color: #666;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .item-stats {
          display: flex;
          gap: 0.5rem;
        }

        .item-price {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ff9800;
          margin-bottom: 1rem;
        }

        .btn-buy,
        .btn-owned {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-buy {
          background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
          color: white;
        }

        .btn-buy:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 154, 158, 0.4);
        }

        .btn-buy:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
        }

        .btn-owned {
          background: #4CAF50;
          color: white;
          cursor: default;
        }
      `}</style>
    </div>
  );
};

