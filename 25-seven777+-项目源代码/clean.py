import pandas as pd

# 加载数据（注意检查实际列名）
df_1star = pd.read_csv('archive//one-star-michelin-restaurants.csv')
df_2star = pd.read_csv('archive//two-stars-michelin-restaurants.csv')
df_3star = pd.read_csv('archive//three-stars-michelin-restaurants.csv')

# 添加星级列（因为原始数据是分文件存储的）
df_1star['stars'] = 1
df_2star['stars'] = 2
df_3star['stars'] = 3

# 合并数据集
all_data = pd.concat([df_1star, df_2star, df_3star])

# 数据清洗
def clean_data(df):
    # 检查并重命名列（根据实际数据集调整）
    column_mapping = {
        'name': 'name',
        'price': 'price',
        'cuisine': 'cuisine',
        'city': 'city',
        'region': 'country',  # 可能region代表国家
        'latitude': 'lat',
        'longitude': 'lng',
        'url': 'address',
        'year': 'year'
    }
    df = df.rename(columns=column_mapping)

    # 标准化价格等级（将$符号转换为数字）
    if 'price' in df.columns:
        df['price_level'] = df['price'].str.len().fillna(1)
    else:
        df['price_level'] = 1  # 默认值

    # 处理菜式分类
    if 'cuisine' in df.columns:
        df['cuisine'] = df['cuisine'].str.split(',').str[0].str.strip()
        df['cuisine'] = df['cuisine'].fillna('Unknown')
    else:
        df['cuisine'] = 'Unknown'

    # 标准化位置信息
    for col in ['city', 'country']:
        if col in df.columns:
            df[col] = df[col].str.title().str.strip()

    # 确保必要的列存在
    for col in ['lat', 'lng']:
        if col not in df.columns:
            df[col] = None

    return df

# 清洗数据
cleaned_data = clean_data(all_data)

# 删除包含缺失值的行
cleaned_data = cleaned_data.dropna()

# 导出为CSV
cleaned_data[['name', 'stars', 'price_level', 'cuisine', 'city', 'country', 'year', 'lat', 'lng', 'address']] \
    .to_csv('restaurants_clean.csv', index=False)

print("数据处理完成！输出文件：restaurants_clean.csv")
