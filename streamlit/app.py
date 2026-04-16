import streamlit as st
import pandas as pd
import os
import re
import hashlib
from datetime import datetime
from functools import lru_cache

FILE_NAME = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'my_daily_log.csv')
MAX_FIELD_LENGTH = 500
CSV_COLUMNS = ["日期", "快乐的事", "充实的事", "待改进的事", "今日反思", "感恩的人"]

st.set_page_config(page_title="我的每日成长日志", page_icon="🌱", layout="wide")

_data_cache = {"mtime": None, "data": None}

def load_data():
    try:
        if not os.path.exists(FILE_NAME):
            df = pd.DataFrame(columns=CSV_COLUMNS)
            _data_cache["mtime"] = 0
            _data_cache["data"] = df
            return df
        mtime = os.path.getmtime(FILE_NAME)
        if _data_cache["mtime"] == mtime and _data_cache["data"] is not None:
            return _data_cache["data"].copy()
        df = pd.read_csv(FILE_NAME, dtype=str, keep_default_na=False)
        for col in CSV_COLUMNS:
            if col not in df.columns:
                df[col] = ""
        _data_cache["mtime"] = mtime
        _data_cache["data"] = df.copy()
        return df
    except pd.errors.EmptyDataError:
        df = pd.DataFrame(columns=CSV_COLUMNS)
        _data_cache["data"] = df.copy()
        return df
    except pd.errors.ParserError as e:
        st.error(f"CSV 文件解析错误：{e}")
        df = pd.DataFrame(columns=CSV_COLUMNS)
        return df
    except Exception as e:
        st.error(f"加载数据时出错：{e}")
        return pd.DataFrame(columns=CSV_COLUMNS)

def save_data(data):
    try:
        df = load_data()
        new_row = pd.DataFrame([data])
        df = pd.concat([df, new_row], ignore_index=True)
        os.makedirs(os.path.dirname(FILE_NAME), exist_ok=True)
        df.to_csv(FILE_NAME, index=False, encoding='utf-8-sig')
        _data_cache["mtime"] = None
        _data_cache["data"] = None
    except PermissionError:
        st.error("文件写入权限不足，请检查文件是否被其他程序占用。")
    except Exception as e:
        st.error(f"保存数据时出错：{e}")

def sanitize_text(text, max_length=MAX_FIELD_LENGTH):
    if not isinstance(text, str):
        text = str(text)
    text = text.strip()[:max_length]
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return text

def validate_date(date_val):
    try:
        if isinstance(date_val, datetime):
            return date_val.strftime('%Y-%m-%d')
        date_str = str(date_val)
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except ValueError:
        return None

st.title("🌱 我的每日成长日志系统")
st.markdown("Keep growing, day by day.")

menu = ["📝 写日志", "📅 查看历史", "📤 数据导出"]
choice = st.sidebar.selectbox("功能菜单", menu)

if choice == "📝 写日志":
    st.header("今天的复盘")

    with st.form("journal_form"):
        col1, col2 = st.columns([1, 2])
        with col1:
            date_input = st.date_input("日期", datetime.now())

        st.markdown("---")

        happy = st.text_area("😄 今天快乐的事", placeholder="记录下让你嘴角上扬的瞬间...", max_chars=500)
        fulfilling = st.text_area("💪 今天充实的事", placeholder="完成了什么任务？学到了什么新知？", max_chars=500)
        improve = st.text_area("🔧 今天应该改进的事", placeholder="哪里可以做得更好？", max_chars=500)
        reflection = st.text_area("🤔 今天的反思", placeholder="对生活、工作的深度思考...", max_chars=500)
        grateful = st.text_area("🙏 今天感恩的人", placeholder="谁帮助了你？或者你想感谢谁？", max_chars=500)

        submitted = st.form_submit_button("💾 保存日志")

        if submitted:
            sanitized_happy = sanitize_text(happy)
            sanitized_fulfilling = sanitize_text(fulfilling)
            sanitized_improve = sanitize_text(improve)
            sanitized_reflection = sanitize_text(reflection)
            sanitized_grateful = sanitize_text(grateful)

            if not sanitized_happy and not sanitized_fulfilling:
                st.warning("请至少填写一项内容再保存哦！")
            else:
                validated_date = validate_date(date_input)
                if not validated_date:
                    st.error("日期格式无效，请重新选择。")
                else:
                    new_entry = {
                        "日期": validated_date,
                        "快乐的事": sanitized_happy,
                        "充实的事": sanitized_fulfilling,
                        "待改进的事": sanitized_improve,
                        "今日反思": sanitized_reflection,
                        "感恩的人": sanitized_grateful,
                    }
                    save_data(new_entry)
                    st.success(f"{validated_date} 的日志已成功保存！")

elif choice == "📅 查看历史":
    st.header("历史记录")
    df = load_data()

    if df.empty:
        st.info("还没有日志记录，快去写第一篇吧！")
    else:
        search_query = st.text_input("🔍 搜索日志", placeholder="输入关键词搜索...")
        if search_query:
            mask = df.apply(lambda row: search_query.lower() in row.astype(str).str.lower().str.cat(sep=' '), axis=1)
            df = df[mask]

        df = df.sort_values(by="日期", ascending=False)
        st.dataframe(df, use_container_width=True, hide_index=True)

        st.markdown("---")
        st.subheader("📖 详细阅读模式")
        if not df.empty:
            selected_date = st.selectbox("选择日期查看详情", df["日期"].unique())

            if selected_date:
                row = df[df["日期"] == str(selected_date)].iloc[0]

                st.info(f"📅 **日期：{row['日期']}**")

                c1, c2 = st.columns(2)
                with c1:
                    st.markdown(f"### 😄 快乐的事\n>{row['快乐的事']}")
                    st.markdown(f"### 💪 充实的事\n>{row['充实的事']}")
                with c2:
                    st.markdown(f"### 🔧 待改进\n>{row['待改进的事']}")
                    st.markdown(f"### 🙏 感恩的人\n>{row['感恩的人']}")

                st.markdown(f"### 🤔 今日反思\n>{row['今日反思']}")

elif choice == "📤 数据导出":
    st.header("备份与导出")
    df = load_data()

    if df.empty:
        st.warning("暂无数据可导出。")
    else:
        st.write("📊 **当前共有数据：**", len(df), "条")

        csv_data = df.to_csv(index=False, encoding='utf-8-sig').encode('utf-8-sig')
        st.download_button(
            label="📥 下载 CSV 文件 (Excel可读)",
            data=csv_data,
            file_name=f'daily_journal_backup_{datetime.now().strftime("%Y%m%d")}.csv',
            mime='text/csv',
        )

        st.markdown("---")

        st.subheader("📄 导出为 PDF")
        st.write("Streamlit 生成精美 PDF 最好的方法是利用浏览器的打印功能。")
        st.markdown("""
        1. 切换到 **"查看历史"** 菜单。
        2. 选择你想打印的内容（或显示全部）。
        3. 按下键盘 `Ctrl + P` (Windows) 或 `Cmd + P` (Mac)。
        4. 在打印目标中选择 **"另存为 PDF"**。
        """)

        st.markdown("---")
        st.subheader("📂 导入 CSV 数据")
        uploaded_file = st.file_uploader("选择 CSV 文件", type=['csv'], key="csv_import")
        if uploaded_file is not None:
            try:
                import_df = pd.read_csv(uploaded_file, dtype=str, keep_default_na=False)
                required_cols = set(CSV_COLUMNS[:2])
                if not required_cols.issubset(set(import_df.columns)):
                    st.error(f"CSV 文件缺少必要列：{required_cols - set(import_df.columns)}")
                else:
                    existing = load_data()
                    existing_keys = set(
                        existing.apply(lambda r: str(r['日期']) + str(r.get('快乐的事', '')), axis=1)
                    )
                    new_rows = []
                    for _, row in import_df.iterrows():
                        key = str(row.get('日期', '')) + str(row.get('快乐的事', ''))
                        if key not in existing_keys:
                            new_rows.append(row)
                            existing_keys.add(key)
                    if new_rows:
                        merged = pd.concat([existing, pd.DataFrame(new_rows)], ignore_index=True)
                        merged.to_csv(FILE_NAME, index=False, encoding='utf-8-sig')
                        _data_cache["mtime"] = None
                        st.success(f"成功导入 {len(new_rows)} 条新日志！")
                    else:
                        st.info("没有新的日志需要导入（数据已存在）。")
            except pd.errors.ParserError as e:
                st.error(f"CSV 解析错误：{e}")
            except Exception as e:
                st.error(f"导入失败：{e}")
