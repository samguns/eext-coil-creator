document.addEventListener('DOMContentLoaded', () => {
	const languages = {
		cn: {
			coilNum: '圈数:',
			innerRadius: '内半径:',
			trackSpacing: '轨道间距:',
			trackWidth: '轨道宽度:',
			centerX: '中心X坐标:',
			centerY: '中心Y坐标:',
			inductance: '电感:',
			internalRadiusMM: '内半径:',
			internalDiameterMM: '内直径:',
			externalRadiusMM: '外半径:',
			externalDiameterMM: '外直径:',
		},
		en: {
			coilNum: 'Number of turns:',
			innerRadius: 'Inner radius:',
			trackSpacing: 'Track spacing:',
			trackWidth: 'Track width:',
			centerX: 'Center X coordinate:',
			centerY: 'Center Y coordinate:',
			inductance: 'Inductance:',
			internalRadiusMM: 'Internal radius:',
			internalDiameterMM: 'Internal diameter:',
			externalRadiusMM: 'External radius:',
			externalDiameterMM: 'External diameter:',
		},
	};
	let currentLanguage = 'cn'; // 默认语言为中文

	function switchLanguage() {
		currentLanguage = currentLanguage === 'cn' ? 'en' : 'cn'; // 切换语言
		updateLanguage();
	}

	/**
	 *Function 平面螺线圈生成
	 *输入 线圈圈数，内半径，轨道间距，轨道宽度，线圈中心的X，Y坐标。
	 *计算路径点
	 *算法	极坐标转换 x=centerX+r⋅cos(a) y=centerY+r⋅sin(a) r为径向距离 a为角度
	 *		根据线圈路径从下往上跨越中心线，或从上往下跨越来判断圈数
	 *输出 绘制线段
	 */
	async function drawCoil(coilNum = 100, innerRadius = 10, trackSpacing = 4, trackWidth = 4, centerX = 0, centerY = 0) {
		const safetyLimit = 1000000; // 限制线圈的段数
		const angleStep = 0.1; // 角度步长
		const radiusStep = trackSpacing / 3; // 半径步长
		let Coils = []; // 线圈数组
		let radius = innerRadius;
		let turns = 0; // 线圈圈数
		let analog = 0;
		let i = 0;

		while (turns <= coilNum && i < safetyLimit) {
			analog = angleStep * i;
			radius = innerRadius + radiusStep * analog;
			Coils.push({
				x: centerX + radius * Math.cos(analog),
				y: centerY + radius * Math.sin(analog),
			});

			// 线圈路径点在Y轴上是否跨越CenterY
			if (i > 0) {
				let lastPoint = Coils[Coils.length - 1]; // 当前点
				let secondLastPoint = Coils[Coils.length - 2]; // 前一个点
				// 线圈路径从下往上跨越中心线，或从上往下
				if ((secondLastPoint.y <= centerY && lastPoint.y > centerY) || (secondLastPoint.y < centerY && lastPoint.y >= centerY)) {
					turns++;
				}
			}

			i++;
		}
		for (let i = 1; i < Coils.length; i++) {
			await eda.pcb_PrimitiveLine.create('GND', 1, Coils[i - 1].x, Coils[i - 1].y, Coils[i].x, Coils[i].y, trackWidth * 0.1, false);
		}
	}

	function updateLanguage() {
		// 更新标签
		document.getElementById('coilNumLabel').textContent = languages[currentLanguage].coilNum;
		document.getElementById('innerRadiusLabel').textContent = languages[currentLanguage].innerRadius;
		document.getElementById('trackSpacingLabel').textContent = languages[currentLanguage].trackSpacing;
		document.getElementById('trackWidthLabel').textContent = languages[currentLanguage].trackWidth;
		document.getElementById('centerXLabel').textContent = languages[currentLanguage].centerX;
		document.getElementById('centerYLabel').textContent = languages[currentLanguage].centerY;

		// 更新输出参数前的前缀
		document.getElementById('inductancePrefix').textContent = languages[currentLanguage].inductance;
		document.getElementById('internalRadiusPrefix').textContent = languages[currentLanguage].internalRadiusMM;
		document.getElementById('internalDiameterPrefix').textContent = languages[currentLanguage].internalDiameterMM;
		document.getElementById('externalRadiusPrefix').textContent = languages[currentLanguage].externalRadiusMM;
		document.getElementById('externalDiameterPrefix').textContent = languages[currentLanguage].externalDiameterMM;
	}

	document.getElementById('color_mode').addEventListener('change', switchLanguage);
	updateLanguage(); // 初始调用以设置正确的语言

	function outputParameters() {
		const milsToMm = 0.0254;

		let coilNum = Number(document.getElementById('coilNum').value);
		let innerRadius = Number(document.getElementById('innerRadius').value);
		let trackSpacing = Number(document.getElementById('trackSpacing').value);
		let trackWidth = Number(document.getElementById('trackWidth').value);

		let innerRadiusMM = innerRadius * milsToMm;
		let trackSpacingMM = trackSpacing * milsToMm;
		let trackWidthMM = trackWidth * milsToMm;

		// 计算内外半径
		let rInt = innerRadiusMM;
		let rExt = rInt + (coilNum + 1) * (trackSpacingMM + trackWidthMM);
		// 更新内外半径和直径的显示
		document.getElementById('internalRadiusMM').textContent = rInt.toLocaleString();
		document.getElementById('internalDiameterMM').textContent = (rInt * 2).toLocaleString();
		document.getElementById('externalRadiusMM').textContent = rExt.toLocaleString();
		document.getElementById('externalDiameterMM').textContent = (rExt * 2).toLocaleString();

		// 计算电感
		let N = coilNum;
		let Di = (innerRadius / 1000) * 2;
		let A = (Di + N * (trackWidth / 1000 + trackSpacing / 1000)) / 2;
		let inductance_uH = (Math.pow(A, 2) * Math.pow(N, 2)) / (30 * A - 11 * Di);
		let inductance_H = inductance_uH * 1e-6;

		// 根据电感值选择合适的单位并更新显示
		if (inductance_H >= 1) document.getElementById('inductance').innerText = inductance_H.toLocaleString();
		else if (inductance_H >= 1e-3) document.getElementById('inductance').innerText = (inductance_H * 1e3).toLocaleString();
		else if (inductance_H >= 1e-6) document.getElementById('inductance').innerText = (inductance_H * 1e6).toLocaleString();
		else if (inductance_H >= 1e-9) document.getElementById('inductance').innerText = (inductance_H * 1e9).toLocaleString();
		else if (inductance_H >= 1e-12) document.getElementById('inductance').innerText = (inductance_H * 1e12).toLocaleString();
		else if (inductance_H >= 1e-15) document.getElementById('inductance').innerText = (inductance_H * 1e15).toLocaleString();
		else document.getElementById('inductance').innerText = '电感值过小';
	}

	document.getElementById('generateButton').addEventListener('click', () => {
		let coilNum = Number(document.getElementById('coilNum').value);
		let innerRadius = Number(document.getElementById('innerRadius').value);
		let trackSpacing = Number(document.getElementById('trackSpacing').value);
		let trackWidth = Number(document.getElementById('trackWidth').value);
		let centerX = Number(document.getElementById('centerX').value);
		let centerY = Number(document.getElementById('centerY').value);

		outputParameters();
		drawCoil(coilNum, innerRadius, trackSpacing, trackWidth, centerX, centerY);
	});

	document.querySelectorAll('input[type="number"]').forEach((input) => {
		input.addEventListener('input', outputParameters);
	});
});

document.getElementById('coilNumLabel').innerHTML = '22222'
