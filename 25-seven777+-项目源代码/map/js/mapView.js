// 全局变量
let map;
let markers = [];
let markerCluster;
let restaurantData = [];

// 初始化地图
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);
    
    markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 15
    });
    map.addLayer(markerCluster);
}

// 创建自定义标记图标
function createMarkerIcon(starCount) {
    const colors = ['#2ecc71', '#f39c12', '#e74c3c'];
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color:${colors[starCount-1]};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold">${starCount}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

// 创建弹出窗口内容
function createPopupContent(restaurant) {
    return `
        <div class="restaurant-popup">
            <h3>${restaurant.name}</h3>
            <div class="popup-meta">
                <span style="color:#f39c12">${'★'.repeat(restaurant.stars)}</span>
                <span style="color:#27ae60">${'$'.repeat(restaurant.price_level || 1)}</span>
                <span style="background:#3498db;color:white;padding:2px 5px;border-radius:3px">${restaurant.cuisine}</span>
            </div>
            <p>${restaurant.city}, ${restaurant.country}</p>
            ${restaurant.address ? `<p>${restaurant.address}</p>` : ''}
            <small>获星年份: ${restaurant.year}</small>
        </div>
    `;
}

// 加载CSV数据
async function loadRestaurantData() {
    try {
        // 使用fetch API加载CSV文件
        const response = await fetch('data//restaurants_clean.csv');
        const csvData = await response.text();
        
        // 解析CSV数据
        const parsedData = parseCSV(csvData);
        
        // 转换数据格式
        restaurantData = parsedData.map(item => ({
            name: item.name,
            stars: parseInt(item.stars) || 1,
            price_level: parseInt(item.price_level) || 1,
            cuisine: item.cuisine || 'Unknown',
            city: item.city || 'Unknown',
            country: item.country || 'Unknown',
            year: item.year || 'N/A',
            lat: parseFloat(item.lat || item.latitude),
            lng: parseFloat(item.lng || item.longitude),
            address: item.address || ''
        }));
        
        updateMap(restaurantData);
        populateFilters(restaurantData);
    } catch (error) {
        console.error("加载数据失败:", error);
        alert("无法加载餐厅数据，请检查控制台获取详细信息");
    }
}

// 简单的CSV解析器
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
            return obj;
        }, {});
    });
}

// 更新地图标记
function updateMap(data) {
    markerCluster.clearLayers();
    markers = [];
    
    data.forEach(restaurant => {
        if (!isNaN(restaurant.lat) && !isNaN(restaurant.lng)) {
            const marker = L.marker([restaurant.lat, restaurant.lng], {
                icon: createMarkerIcon(restaurant.stars)
            }).bindPopup(createPopupContent(restaurant));
            markers.push(marker);
        }
    });
    
    markerCluster.addLayers(markers);
    
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// 填充筛选器
function populateFilters(data) {
    const countries = [...new Set(data.map(r => r.country))].filter(Boolean);
    const countrySelect = document.getElementById('country-filter');
    
    // 清空现有选项
    countrySelect.innerHTML = '<option value="" selected disabled>选择国家</option>';
    
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadRestaurantData();
    
    // 事件监听
    document.getElementById('apply-filters').addEventListener('click', function() {
        const selectedCountries = [...document.getElementById('country-filter').selectedOptions]
            .map(o => o.value)
            .filter(v => v);
        
        const selectedStars = [...document.getElementById('stars-filter').selectedOptions]
            .map(o => parseInt(o.value))
            .filter(v => !isNaN(v));
        
        const filtered = restaurantData.filter(restaurant => {
            const countryMatch = selectedCountries.length === 0 || 
                               selectedCountries.includes(restaurant.country);
            const starsMatch = selectedStars.length === 0 || 
                              selectedStars.includes(parseInt(restaurant.stars));
            return countryMatch && starsMatch;
        });
        
        updateMap(filtered);
    });
    
    document.getElementById('reset-filters').addEventListener('click', function() {
        document.getElementById('country-filter').value = '';
        document.getElementById('stars-filter').value = '';
        updateMap(restaurantData);
    });
});
