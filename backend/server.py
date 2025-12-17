import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import dashscope
from dashscope import MultiModalConversation

# --- 配置 ---
# 1. 检查并设置Dashscope API Key
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
if not DASHSCOPE_API_KEY:
    raise ValueError("错误：环境变量 DASHSCOPE_API_KEY 未设置。请设置该变量。")
print("Dashscope API Key 已找到。")

# 2. 初始化Flask应用
app = Flask(__name__)
CORS(app)

# 3. 配置Dashscope API的基础URL (如果需要切换地域)
# dashscope.base_http_api_url = 'https://dashscope.aliyuncs.com/api/v1'

print("--- 服务器已就绪 (运行于纯API模式)。 ---")


# --- API 路由 ---

# 在 backend/server.py 中

# 在 backend/server.py 中

@app.route('/api/breakdown-story', methods=['POST'])
def breakdown_story():
    """接收长故事，通过API调用LLM进行拆分"""

    # 增加健壮性和调试日志
    try:
        data = request.get_json()
        if data is None:
            print("错误: 收到的请求体不是有效的JSON。")
            return jsonify({"error": "请求体不是有效的JSON"}), 400
        
        print(f"--- 后端收到的原始请求数据 ---: {data}")

        raw_story = data.get('story') # 不再提供默认值，让它在没有'story'键时返回None
        if not raw_story or not isinstance(raw_story, str) or not raw_story.strip():
            print(f"错误: 请求数据中缺少'story'字段，或者'story'为空。收到的数据: {data}")
            return jsonify({"error": "请求中缺少有效的'story'内容"}), 400
    except Exception as e:
        print(f"解析请求数据时发生错误: {e}")
        return jsonify({"error": "无法解析请求数据"}), 400

    # --- 后续的AI调用逻辑保持不变 ---
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        
        prompt = f"""
        Your task is to parse the following user story or report into a sequence of individual scenes...
        The final output should be a JSON object containing a single key "scenes"...
        
        Here is the original text:
        ---
        {raw_story} 
        ---
        """
        
        messages=[
            {"role": "system", "content": "You are an assistant... Your output MUST be a valid JSON object."},
            {"role": "user", "content": prompt}
        ]

        completion = client.chat.completions.create(
            model="qwen-plus", 
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        
        print("--- AI模型原始返回 (breakdown_story) ---")
        print(response_content)
        print("-----------------------------------------")

        parsed_data = json.loads(response_content)
        
        # 健壮的解析逻辑
        if isinstance(parsed_data, dict):
            for key, value in parsed_data.items():
                if isinstance(value, list):
                    return jsonify({"scenes": value})
        
        if isinstance(parsed_data, list):
            return jsonify({"scenes": parsed_data})

        # 如果AI返回了错误信息，我们把它转发给前端
        if isinstance(parsed_data, dict) and 'error' in parsed_data:
             return jsonify({"error": f"AI模型返回错误: {parsed_data['error']}"}), 400

        return jsonify({"error": "AI返回了无效的数据结构"}), 400

    except Exception as e:
        print(f"故事拆分过程中发生异常: {e}")
        return jsonify({"error": "通过API拆分故事失败", "details": str(e)}), 500


@app.route('/api/analyze-character', methods=['POST'])
def analyze_character():
    """
    (已升级) 接收Base64图片，通过原生SDK调用 qwen3-vl-plus 进行分析
    """
    data = request.json
    image_base64 = data.get('image_base64', '')
    if not image_base64:
        return jsonify({"error": "图片数据不能为空"}), 400

    # Dashscope原生SDK可以直接处理 "data:image/jpeg;base64,..." 格式
    if not image_base64.startswith('data:image'):
        image_base64 = f"data:image/png;base64,{image_base64.split(',')[-1]}"

    messages = [
        {
            "role": "user",
            "content": [
                {"image": image_base64},
                {"text": "Describe the key visual features of the character in this image in detail. Focus on hairstyle, hair color, face shape, facial features, clothing style and color, and any prominent accessories."}
            ]
        }
    ]

    try:
        response = MultiModalConversation.call(
            api_key=DASHSCOPE_API_KEY,
            model="qwen3-vl-plus",
            messages=messages,
            stream=False, # 我们不需要流式输出，直接获取最终结果
        )

        if response.status_code == 200:
            # 提取完整的文本回复
            analysis_text = response.output.choices[0].message.content[0]['text']
            return jsonify({"analysis": analysis_text})
        else:
            print(f"Dashscope API 错误 (qwen3-vl-plus): Code {response.code}, Message: {response.message}")
            return jsonify({"error": "通过API分析角色失败", "details": f"错误码: {response.code}, 信息: {response.message}"}), 500
    
    except Exception as e:
        print(f"角色分析过程中发生异常: {e}")
        return jsonify({"error": "服务器内部错误", "details": str(e)}), 500


# 在 backend/server.py 中

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    """
    (已回退) 接收prompt，使用 qwen-image-plus 生成图片
    """
    data = request.json
    prompt = data.get('prompt', '')
    # 这个版本不再需要 ref_image_base64

    if not prompt:
        return jsonify({"error": "Prompt不能为空"}), 400
    
    # 构建适用于 qwen-image-plus 的消息格式
    messages = [
        {
            "role": "user",
            "content": [
                {"text": prompt}
            ]
        }
    ]
    
    try:
        response = MultiModalConversation.call(
            api_key=DASHSCOPE_API_KEY,
            model="qwen-image-plus", # <--- 已回退到 qwen-image-plus
            messages=messages,
            result_format='message',
        )

        if response.status_code == 200:
            # 提取图片URL
            image_url = response.output.choices[0].message.content[0]['image']
            return jsonify({'imageUrl': image_url})
        else:
            print(f"Dashscope API 错误 (qwen-image-plus): Code {response.code}, Message: {response.message}")
            return jsonify({
                "error": "图片生成失败",
                "details": f"错误码: {response.code}, 信息: {response.message}"
            }), 500

    except Exception as e:
        print(f"图片生成过程中发生异常: {e}")
        return jsonify({"error": "服务器内部错误", "details": str(e)}), 500


if __name__ == '__main__':
    # 为了让`breakdown_story`继续工作，我们需要确保openai库已安装
    try:
        from openai import OpenAI
    except ModuleNotFoundError:
        print("警告: 'openai' 库未安装。故事拆分功能将无法使用。")
        print("请运行 'pip install openai' 来安装它。")
    
    app.run(host='0.0.0.0', port=5001, debug=True)