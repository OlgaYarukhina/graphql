const xpBlock = document.querySelector('.xp_progression');
const auditBlock = document.querySelector('.audits_ratio');
const auditResult = document.getElementById('audit_result');
const auditTotal = document.getElementById('audit_total');
const auditChart = document.getElementById('audit_chart');
const setData = document.querySelector('.circle_front')
const circleChart = document.getElementById('circle_chart')
const xpTotal = document.getElementById('xp_total');


const displayError = (message) => {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

const makeGraphQLRequest = async () => {

    let data = {}
    const query = `
    query {
        user {
            id
            login
            attrs
            totalUp
            totalDown
            createdAt
            updatedAt
            transactions(order_by: { createdAt: asc }) {
                id
                userId
                type
                amount
                createdAt
                path
            }
        }
    }`;

    await fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ query }),
    })
        .then(response => response.json())
        .then(result => {
            data = result
        })
    return data;
}

// Audit Graph


const creationGraphAuditRation = (recieved, done) => {

    let total = (((done - recieved) / 1000000) + 1).toFixed(1);

    setData.style.strokeDashoffset = 100 / total

    auditTotal.textContent = `Total: ${total}`
    if (total > 1.1) {
        auditResult.textContent = `Good job, baby ;)`;
        auditResult.style.color = "#23df97"
    } else if (total < 0.9) {
        auditResult.textContent = `Are you here? :()`
        auditResult.style.color = "#f3365f"
    } else {
        auditResult.textContent = `Could be better :'`
        auditResult.style.color = "#eeb029"
    }

    circleChart.onmouseover = (e) => {
        const $tooltip = document.createElement('div');
        $tooltip.classList.add('tooltip');
        if (e.target.classList[0] === "circle_front") {
            $tooltip.textContent = `Resived ${(recieved / 1000000).toFixed(2)} MB`;
        } else {
            $tooltip.textContent = `Done ${(done / 1000000).toFixed(2)} MB`;
        }
        e.target.onmouseout = () => {
            $tooltip.remove();
            e.target.onmouseout = null;
        }
        auditChart.appendChild($tooltip);
    }
}


// XP Graph

class Chart {
    createSvgElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName)
    }
    // method
    setAttributes($svgElement, attributesObject) {
        Object.keys(attributesObject).forEach(key => {
            $svgElement.setAttribute(key, attributesObject[key])
        })
    }
}

class LineChart extends Chart {
    xPadding = 30;
    yPadding = 30;
    circleR = 4;

    constructor(data, $container) {
        super(); // need call constructor even there no one
        this.data = data;
        this.$container = $container;
        this.maxWidth = this.$container.offsetWidth;
        this.maxHeight = this.$container.offsetHeight;
        this.maxChartWidth = this.maxWidth - this.xPadding * 3;
        this.maxChartHeight = this.maxHeight - this.yPadding;
    }

    createChartLine() {
        const $chartLine = this.createSvgElement('path')
        this.setAttributes($chartLine, {
            stroke: 'rgb(129, 145, 155)',
            'stroke-width': '2',
            fill: 'none',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
        })
        return $chartLine
    }

    createAxisXSeparator() {
        const $axisXLine = this.createSvgElement('line');
        this.setAttributes($axisXLine, {
            x1: 0,
            x2: this.maxWidth,
            y1: this.maxChartHeight,
            y2: this.maxChartHeight,
            stroke: 'rgb(119, 119, 119)',
            'stroke-width': 1
        })
        return $axisXLine;
    }

    createCircle(el, x, y) {
        const $circle = this.createSvgElement('circle');
        this.setAttributes($circle, {
            r: this.circleR,
            cx: x,
            cy: y,
            fill: 'rgb(129, 145, 155)',
            stroke: 'rgb(129, 145, 155, .5)',
        })

        $circle.dataset.text = `${el.x.slice(0, -4)}, Total: ${el.y} kB`;
        $circle.classList.add('circle');
        $circle.dataset.circle = 'true';
        return $circle
    }

    onCircleOver($circle) {
        const $tooltip = document.createElement('div');
        $tooltip.textContent = $circle.dataset.text;
        $tooltip.classList.add('tooltip');
        $circle.setAttribute('stroke-width', 15);
        const popperElement = Popper.createPopper($circle, $tooltip);
        $circle.onmouseout = () => {
            $tooltip.remove();
            $circle.setAttribute('stroke-width', 0);
            $circle.onmouseout = null;
        }
        this.$container.appendChild($tooltip);
    }

    create() {
        const $svg = document.getElementById('chart')
        this.setAttributes($svg, {
            width: '100%',
            height: '100%',
            viewBox: `0 0 ${this.maxWidth} ${this.maxHeight}`
        })



        // create axises

        const $legendXLine = this.createAxisXSeparator()


        // create line of gragh
        const $chartLine = this.createChartLine();
        const lineLength = this.maxChartWidth / (this.data.length - 1);

        $svg.append($chartLine, $legendXLine);

        let d = 'M ';  // M - move to
        let currentX = 0 + this.xPadding;
        this.data.forEach((el, i) => {
            const x = currentX;
            const y = this.maxChartHeight - el.y
            d += `${x} ${y} L `


            const $circle = this.createCircle(el, x, y);
            const $legendXValue = this.createSvgElement('text');
            this.setAttributes($legendXValue, {
                x: x - lineLength + 10,
                y: this.maxHeight - 4
            })

            $legendXValue.append(el.x)
            $legendXValue.classList.add('text');
            // or
            //    $legendX.textContent = el.x;

            $svg.append($circle, $legendXValue)
            currentX += lineLength;
        });

        d = d.slice(0, -3);

        $chartLine.setAttribute('d', d);
        this.$container.appendChild($svg);

        $svg.onmouseover = (e) => {
            if (e.target.dataset.circle) {
                this.onCircleOver(e.target)
            }
        }

        return this
    }
}




const creationGraphXPRation = (data) => {


    let totalXP = 0;
    let monthTotalXP = 0;

    const relsults = [
        {
            month: '10',
            x: "Start '22",
            y: monthTotalXP,
        },
        {
            month: '11',
            x: "November '22",
            y: monthTotalXP,
        },
        {
            month: '12',
            x: "December '22",
            y: monthTotalXP,
        },
        {
            month: '01',
            x: "January '23",
            y: monthTotalXP,
        },
        {
            month: '02',
            x: "February '23",
            y: monthTotalXP,
        },
        {
            month: '03',
            x: "March '23",
            y: monthTotalXP,
        },
        {
            month: '04',
            x: "April '23",
            y: monthTotalXP,
        },
        {
            month: '05',
            x: "May '23",
            y: monthTotalXP,
        },
        {
            month: '06',
            x: "June '23",
            y: monthTotalXP,
        },
        {
            month: '07',
            x: "July '23",
            y: monthTotalXP,
        },
    ]

    let resultsArr = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].type === "xp" && !/piscine-js/.test(data[i].path) && !/piscine-go/.test(data[i].path)) {
            totalXP += data[i].amount;
            resultsArr.push(data[i])
        }
    }

    totalXP = Math.round(totalXP / 1000);
    xpTotal.textContent = `Total: ${totalXP} kB`

    for (let i = 0; i < relsults.length; i++) {
        for (let j = 0; j < resultsArr.length; j++) {
            if (resultsArr[j].createdAt.slice(5, 7) === relsults[i].month) {
                monthTotalXP += resultsArr[j].amount
            }
        }
        relsults[i].y = (monthTotalXP / 1000).toFixed(1)
    }

    console.log(monthTotalXP)
    console.log(relsults)

    const $xpchartContainer = document.getElementById('xp_chart')
    new LineChart(relsults, $xpchartContainer).create()
};
