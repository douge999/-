// 获取筛选器的当前值
export function getFilterValues() {
    return {
        countries: getSelectedOptions('country'),
        cities: getSelectedOptions('city'),
        cuisines: getSelectedOptions('cuisine'),
        stars: getSelectedOptions('stars').map(Number),
        search: document.getElementById('search').value.toLowerCase()
    };
}

// 获取下拉框选中的选项
function getSelectedOptions(id) {
    const select = document.getElementById(id);
    return Array.from(select.selectedOptions).map(opt => opt.value);
}

// 筛选餐厅数据
export function filterRestaurants(data) {
    const filters = getFilterValues();
    
    return data.filter(restaurant => {
        return (
            (filters.countries.length === 0 || filters.countries.includes(restaurant.country)) &&
            (filters.cities.length === 0 || filters.cities.includes(restaurant.city)) &&
            (filters.cuisines.length === 0 || filters.cuisines.includes(restaurant.cuisine)) &&
            (filters.stars.length === 0 || filters.stars.includes(restaurant.stars)) &&
            (filters.search === '' || 
             restaurant.name.toLowerCase().includes(filters.search) ||
             (restaurant.description && restaurant.description.toLowerCase().includes(filters.search)))
        );
    });
}

// 填充下拉选项
export function populateFilterOptions(data) {
    const uniqueValues = (arr, key) => [...new Set(arr.map(item => item[key]))].filter(Boolean);

    fillSelect('country', uniqueValues(data, 'country'));
    fillSelect('city', uniqueValues(data, 'city'));
    fillSelect('cuisine', uniqueValues(data, 'cuisine'));
}

function fillSelect(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    options.sort().forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

