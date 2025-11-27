import streamlit as st
import pandas as pd
import os
from datetime import datetime

# --- 配置部分 ---
FILE_NAME = 'my_daily_log.csv'

# 页面设置
st.set_page_config(page_title="我的每日成长日志", page_icon="🌱", layout="wide")

# --- 核心函数 ---

def load_data():
    """加载本地CSV数据，如果不存在则创建一个空的DataFrame"""
    if not os.path.exists(FILE_NAME):
        df = pd.DataFrame(columns=["日期", "快乐的事", "充实的事", "待改进的事", "今日反思", "感恩的人"])
        return df
    else:
        return pd.read_csv(FILE_NAME)

def save_data(data):
    """将新的一条记录保存到CSV"""
    df = load_data()
    # 将新数据转换为DataFrame并合并
    new_row = pd.DataFrame([data])
    df = pd.concat([df, new_row], ignore_index=True)
    # 保存文件，使用 utf-8-sig 防止 Excel 打开乱码
    df.to_csv(FILE_NAME, index=False, encoding='utf-8-sig') 

def convert_df_to_csv(df):
    """将DataFrame转换为CSV下载流"""
    return df.to_csv(index=False, encoding='utf-8-sig').encode('utf-8-sig')

# --- 界面设计 ---

st.title("🌱 我的每日成长日志系统")
st.markdown("Keep growing, day by day.")

# 创建侧边栏导航
menu = ["📝 写日志", "📅 查看历史", "📤 数据导出"]
choice = st.sidebar.selectbox("功能菜单", menu)

# --- 功能 1: 写日志 ---
if choice == "📝 写日志":
    st.header("今天的复盘")
    
    with st.form("journal_form"):
        col1, col2 = st.columns([1, 2])
        with col1:
            date_input = st.date_input("日期", datetime.now())
        
        st.markdown("---")
        
        # 输入字段
        happy = st.text_area("😄 今天快乐的事", placeholder="记录下让你嘴角上扬的瞬间...")
        fulfilling = st.text_area("💪 今天充实的事", placeholder="完成了什么任务？学到了什么新知？")
        improve = st.text_area("🔧 今天应该改进的事", placeholder="哪里可以做得更好？")
        reflection = st.text_area("🤔 今天的反思", placeholder="对生活、工作的深度思考...")
        grateful = st.text_area("🙏 今天感恩的人", placeholder="谁帮助了你？或者你想感谢谁？")
        
        submitted = st.form_submit_button("💾 保存日志")
        
        if submitted:
            if not happy and not fulfilling: # 简单的非空校验
                st.warning("请至少填写一项内容再保存哦！")
            else:
                new_entry = {
                    "日期": date_input,
                    "快乐的事": happy,
                    "充实的事": fulfilling,
                    "待改进的事": improve,
                    "今日反思": reflection,
                    "感恩的人": grateful
                }
                save_data(new_entry)
                st.success(f"{date_input} 的日志已成功保存！")

# --- 功能 2: 查看历史 ---
elif choice == "📅 查看历史":
    st.header("历史记录")
    df = load_data()
    
    if df.empty:
        st.info("还没有日志记录，快去写第一篇吧！")
    else:
        # 按日期倒序排列
        df = df.sort_values(by="日期", ascending=False)
        st.dataframe(df, use_container_width=True)

        # 详情展示模式
        st.markdown("---")
        st.subheader("📖 详细阅读模式")
        selected_date = st.selectbox("选择日期查看详情", df["日期"].unique())
        
        if selected_date:
            row = df[df["日期"] == str(selected_date)].iloc[0]
            
            # 卡片式展示
            st.info(f"📅 **日期：{row['日期']}**")
            
            c1, c2 = st.columns(2)
            with c1:
                st.markdown(f"### 😄 快乐的事\n>{row['快乐的事']}")
                st.markdown(f"### 💪 充实的事\n>{row['充实的事']}")
            with c2:
                st.markdown(f"### 🔧 待改进\n>{row['待改进的事']}")
                st.markdown(f"### 🙏 感恩的人\n>{row['感恩的人']}")
            
            st.markdown(f"### 🤔 今日反思\n>{row['今日反思']}")

# --- 功能 3: 数据导出 ---
elif choice == "📤 数据导出":
    st.header("备份与导出")
    df = load_data()
    
    if df.empty:
        st.warning("暂无数据可导出。")
    else:
        st.write("📊 **当前共有数据：**", len(df), "条")
        
        # 1. 导出 CSV
        csv_data = convert_df_to_csv(df)
        st.download_button(
            label="📥 下载 CSV 文件 (Excel可读)",
            data=csv_data,
            file_name='daily_journal_backup.csv',
            mime='text/csv',
        )
        
        st.markdown("---")
        
        # 2. 导出 PDF (技巧版)
        st.subheader("📄 导出为 PDF")
        st.write("Streamlit 生成精美 PDF 最好的方法是利用浏览器的打印功能。")
        st.markdown("""
        1. 切换到 **“查看历史”** 菜单。
        2. 选择你想打印的内容（或显示全部）。
        3. 按下键盘 `Ctrl + P` (Windows) 或 `Cmd + P` (Mac)。
        4. 在打印目标中选择 **“另存为 PDF”**。
        """)