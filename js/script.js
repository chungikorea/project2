document.addEventListener('DOMContentLoaded', () => {

// *** Supabase 설정 정보 ***
const SUPABASE_URL = 'https://crnkirlxwbfqbusxtpqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybmtpcmx4d2JmcWJ1c3h0cHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1OTUyNDQsImV4cCI6MjA3ODE3MTI0NH0.p6iXMyN1-QqRm2ii00XfNbcl2CHuHYcYc9--47j30AQ';

const TABLE_NAME = 'MEDICA_2025';
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalCount = 0;
let currentSearchTerm = '';
let currentSearchField = 'name'; // 기본값을 name으로 설정

// Project 2 동적 테이블 뷰어 변수
let currentDynamicTable = '';
let currentDynamicPage = 1;
let currentDynamicSearchTerm = '';
let dynamicTotalCount = 0;
let tableColumns = [];

// Supabase 초기화
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM 요소
const cheongAiBtn = document.getElementById('cheong-ai-btn');
const mainCenter = document.getElementById('main-center');
const homeBtn = document.getElementById('home-btn');
const leftMenu = document.getElementById('left-menu');
const rightContent = document.getElementById('right-content');
const menuItems = document.querySelectorAll('.menu-item');
const dataBody = document.getElementById('data-body');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchField = document.getElementById('search-field'); // 추가: select box

// *** 이벤트 리스너 ***

// 1. 청AI 버튼 클릭: 메뉴 토글
cheongAiBtn.addEventListener('click', () => {
    mainCenter.classList.add('hidden');
    leftMenu.classList.add('open');
    document.querySelector('.menu-item[data-project="project1"]').click();
    rightContent.classList.add('menu-open');
});

// 2. 메뉴 항목 클릭
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        menuItems.forEach(i => i.classList.remove('active'));
        e.target.classList.add('active');

        const project = e.target.dataset.project;

        if (project === 'project1') {
            rightContent.classList.add('active');
            if (leftMenu.classList.contains('open')) {
                rightContent.classList.add('menu-open');
            }
            // Project 1 표시, Project 2 숨김
            document.getElementById('project1-content').style.display = 'block';
            document.getElementById('project2-content').style.display = 'none';
            
            currentPage = 1;
            currentSearchTerm = '';
            searchInput.value = '';
            searchField.value = 'name';
            currentSearchField = 'name';
            fetchDataAndRender();
        } else if (project === 'project2') {
            rightContent.classList.add('active');
            if (leftMenu.classList.contains('open')) {
                rightContent.classList.add('menu-open');
            }
            // Project 2 표시, Project 1 숨김
            document.getElementById('project1-content').style.display = 'none';
            document.getElementById('project2-content').style.display = 'block';
            
            fetchTablesList();
        } else {
            rightContent.classList.remove('active');
            rightContent.classList.remove('menu-open');
        }
    });
});

// 3. 홈 버튼 클릭: 청AI 화면으로 복귀
homeBtn.addEventListener('click', () => {
    mainCenter.classList.remove('hidden');
    leftMenu.classList.remove('open');
    rightContent.classList.remove('active');
    rightContent.classList.remove('menu-open');
}); 

// 4. 검색 버튼 클릭
searchBtn.addEventListener('click', () => {
    currentSearchTerm = searchInput.value.trim();
    currentSearchField = searchField.value; // 선택된 필드 저장
    currentPage = 1;
    fetchDataAndRender();
});

// 5. Enter 키로 검색 (편의성 추가)
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// 6. 페이지 버튼 클릭 (동적 생성되므로 이벤트 위임)
paginationContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('page-btn') && 
        !e.target.classList.contains('current-page') && 
        !e.target.classList.contains('disabled')) {
        const newPage = parseInt(e.target.dataset.page);
        if (newPage > 0 && newPage <= Math.ceil(totalCount / ITEMS_PER_PAGE)) {
            currentPage = newPage;
            fetchDataAndRender();
        }
    }
});


// *** Supabase 데이터 가져오기 함수 ***

async function fetchDataAndRender() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE - 1;

    let query = supabaseClient
        .from(TABLE_NAME)
        .select('*', { count: 'exact' })
        .order('no', { ascending: true });

    // 검색 조건 추가 - 선택된 필드에 따라 다르게 검색
    if (currentSearchTerm) {
        if (currentSearchField === 'no') {
            // no은 숫자 필드이므로 정확한 일치 검색
            const noValue = parseInt(currentSearchTerm);
            if (!isNaN(noValue)) {
                query = query.eq('no', noValue);
            }
        } else {
            // name, e_mail은 문자열이므로 부분 일치 검색
            query = query.ilike(currentSearchField, `%${currentSearchTerm}%`);
        }
    }

    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching data:', error);
        dataBody.innerHTML = `<tr><td colspan="7">데이터를 불러오는 데 오류가 발생했습니다: ${error.message}</td></tr>`;
        totalCount = 0;
        renderPagination();
        return;
    }

    totalCount = count;
    renderTable(data);
    renderPagination();
}

// *** 테이블 렌더링 함수 ***

function renderTable(data) {
    dataBody.innerHTML = '';

    if (!data || data.length === 0) {
        dataBody.innerHTML = `<tr><td colspan="7">검색 결과가 없습니다.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const row = dataBody.insertRow();
        row.insertCell().textContent = item.no; 
        row.insertCell().textContent = item.name || '';
        row.insertCell().textContent = item.role || '';
        row.insertCell().textContent = item.department || '';
        row.insertCell().textContent = item.e_mail || '';
        row.insertCell().textContent = item.phone || '';
        row.insertCell().textContent = item.exhibitor || '';
    });
}

// *** 페이지네이션 렌더링 함수 ***

function renderPagination() {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (totalPages <= 1) return;

    const maxVisiblePages = 10;
    
    // 현재 페이지가 속한 블록 계산 (1~10은 블록1, 11~20은 블록2, ...)
    const currentBlock = Math.ceil(currentPage / maxVisiblePages);
    
    // 블록의 시작과 끝 페이지 계산
    const startPage = (currentBlock - 1) * maxVisiblePages + 1;
    const endPage = Math.min(currentBlock * maxVisiblePages, totalPages);

    // << 버튼 (맨 처음으로)
    const firstBtn = createPageButton('<<', 1);
    if (currentPage === 1) {
        firstBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(firstBtn);

    // < 버튼 (이전 페이지)
    const prevBtn = createPageButton('<', currentPage - 1);
    if (currentPage === 1) {
        prevBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(prevBtn);

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i, i);
        if (i === currentPage) {
            pageBtn.classList.add('current-page');
        }
        paginationContainer.appendChild(pageBtn);
    }

    // > 버튼 (다음 페이지)
    const nextBtn = createPageButton('>', currentPage + 1);
    if (currentPage === totalPages) {
        nextBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(nextBtn);

    // >> 버튼 (맨 마지막으로)
    const lastBtn = createPageButton('>>', totalPages);
    if (currentPage === totalPages) {
        lastBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(lastBtn);
}

// *** 페이지 버튼 생성 헬퍼 함수 ***

function createPageButton(text, page) {
    const btn = document.createElement('div');
    btn.classList.add('page-btn');
    btn.dataset.page = page;
    btn.textContent = text;
    return btn;
}

// *** Project 2: 테이블 목록 가져오기 ***

async function fetchTablesList() {
    const tablesListContainer = document.getElementById('tables-list');
    tablesListContainer.innerHTML = '<div id="tables-loading">테이블 목록을 불러오는 중...</div>';

    try {
        // Supabase REST API를 통해 정보 스키마 조회
        // 주의: 이 방법은 RLS 정책에 따라 작동하지 않을 수 있습니다
        const { data, error } = await supabaseClient
            .rpc('get_user_tables');

        if (error) {
            // RPC 함수가 없거나 권한이 없는 경우, 수동으로 알려진 테이블 표시
            console.warn('RPC 함수 호출 실패, 알려진 테이블 목록 표시:', error);
            displayKnownTables();
            return;
        }

        if (!data || data.length === 0) {
            tablesListContainer.innerHTML = '<p>테이블이 없거나 접근 권한이 없습니다.</p>';
            return;
        }

        renderTablesList(data);
    } catch (err) {
        console.error('테이블 목록 조회 오류:', err);
        // 오류 발생 시 수동 목록 표시
        displayKnownTables();
    }
}

// 테이블 목록 렌더링
function renderTablesList(tables) {
    const tablesListContainer = document.getElementById('tables-list');
    
    let html = '<ul class="tables-list">';
    tables.forEach(table => {
        html += `
            <li class="table-item" data-table-name="${table.table_name}">
                <div class="table-name">📊 ${table.table_name}</div>
                <div class="table-info">Row count: ${table.row_count || 'N/A'}</div>
            </li>
        `;
    });
    html += '</ul>';
    
    tablesListContainer.innerHTML = html;
    
    // 클릭 이벤트 추가
    document.querySelectorAll('.table-item').forEach(item => {
        item.addEventListener('click', () => {
            const tableName = item.dataset.tableName;
            openTableViewer(tableName);
        });
    });
}

// 알려진 테이블 목록 표시 (fallback)
function displayKnownTables() {
    const tablesListContainer = document.getElementById('tables-list');
    
    // 알고 있는 테이블 목록 (수동으로 관리)
    const knownTables = [
        { table_name: 'MEDICA_2025', description: 'MEDICA 2025 참가자 정보' }
        // 여기에 다른 테이블 추가 가능
    ];
    
    let html = '<p class="info-message">⚠️ 자동 조회 실패. 알려진 테이블 목록을 표시합니다.</p>';
    html += '<ul class="tables-list">';
    
    knownTables.forEach(table => {
        html += `
            <li class="table-item" data-table-name="${table.table_name}">
                <div class="table-name">📊 ${table.table_name}</div>
                ${table.description ? `<div class="table-info">${table.description}</div>` : ''}
            </li>
        `;
    });
    
    html += '</ul>';
    tablesListContainer.innerHTML = html;
    
    // 클릭 이벤트 추가
    document.querySelectorAll('.table-item').forEach(item => {
        item.addEventListener('click', () => {
            const tableName = item.dataset.tableName;
            openTableViewer(tableName);
        });
    });
}

// *** 동적 테이블 뷰어 ***

// 테이블 뷰어 열기
function openTableViewer(tableName) {
    currentDynamicTable = tableName;
    currentDynamicPage = 1;
    currentDynamicSearchTerm = '';
    
    // 화면 전환
    document.getElementById('tables-list-view').style.display = 'none';
    document.getElementById('table-data-view').style.display = 'block';
    
    // 제목 설정
    document.getElementById('current-table-title').textContent = `📊 ${tableName}`;
    
    // 검색창 초기화
    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 데이터 로드
    fetchDynamicTableData();
}

// 테이블 목록으로 돌아가기
const backToTablesBtn = document.getElementById('back-to-tables-btn');
if (backToTablesBtn) {
    backToTablesBtn.addEventListener('click', () => {
        document.getElementById('tables-list-view').style.display = 'block';
        document.getElementById('table-data-view').style.display = 'none';
        currentDynamicTable = '';
    });
}

// 동적 테이블 검색
const tableSearchBtn = document.getElementById('table-search-btn');
const tableSearchInput = document.getElementById('table-search-input');

if (tableSearchBtn) {
    tableSearchBtn.addEventListener('click', () => {
        currentDynamicSearchTerm = tableSearchInput.value.trim();
        currentDynamicPage = 1;
        fetchDynamicTableData();
    });
}

if (tableSearchInput) {
    tableSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            tableSearchBtn.click();
        }
    });
}

// 동적 테이블 페이지네이션 클릭
document.getElementById('table-pagination').addEventListener('click', (e) => {
    if (e.target.classList.contains('page-btn') && 
        !e.target.classList.contains('current-page') && 
        !e.target.classList.contains('disabled')) {
        const newPage = parseInt(e.target.dataset.page);
        const totalPages = Math.ceil(dynamicTotalCount / ITEMS_PER_PAGE);
        if (newPage > 0 && newPage <= totalPages) {
            currentDynamicPage = newPage;
            fetchDynamicTableData();
        }
    }
});

// 동적 테이블 데이터 가져오기
async function fetchDynamicTableData() {
    const tableBody = document.getElementById('dynamic-table-body');
    const tableHead = document.getElementById('dynamic-table-head');
    
    tableBody.innerHTML = '<tr><td colspan="100">데이터를 불러오는 중...</td></tr>';
    
    try {
        const start = (currentDynamicPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;
        
        let query = supabaseClient
            .from(currentDynamicTable)
            .select('*', { count: 'exact' });
        
        // 검색 기능 간소화 (클라이언트 측에서 필터링)
        // Supabase의 or() 구문이 특수문자 처리에 문제가 있어서
        // 모든 데이터를 가져온 후 JavaScript에서 필터링
        
        query = query.range(start, end);
        
        const { data: allData, count: totalCount, error } = await query;
        
        if (error) {
            console.error('데이터 조회 오류:', error);
            tableBody.innerHTML = `<tr><td colspan="100">데이터를 불러오는 데 오류가 발생했습니다: ${error.message}</td></tr>`;
            dynamicTotalCount = 0;
            renderDynamicPagination();
            return;
        }
        
        // 검색어가 있으면 클라이언트 측에서 필터링
        let filteredData = allData;
        let filteredCount = totalCount;
        
        if (currentDynamicSearchTerm && allData && allData.length > 0) {
            const searchLower = currentDynamicSearchTerm.toLowerCase();
            filteredData = allData.filter(row => {
                // 모든 값을 문자열로 변환하여 검색
                return Object.values(row).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(searchLower);
                });
            });
            filteredCount = filteredData.length;
        }
        
        if (!filteredData || filteredData.length === 0) {
            // 컬럼 정보를 위해 limit 1로 조회
            const { data: sampleData } = await supabaseClient
                .from(currentDynamicTable)
                .select('*')
                .limit(1);
            
            if (sampleData && sampleData.length > 0) {
                tableColumns = Object.keys(sampleData[0]);
            } else {
                tableColumns = [];
            }
            
            renderDynamicTableHeader();
            tableBody.innerHTML = `<tr><td colspan="${tableColumns.length || 1}">검색 결과가 없습니다.</td></tr>`;
            dynamicTotalCount = 0;
            renderDynamicPagination();
            return;
        }
        
        // 컬럼 추출 (첫 번째 행에서)
        tableColumns = Object.keys(filteredData[0]);
        
        dynamicTotalCount = filteredCount;
        renderDynamicTableHeader();
        renderDynamicTableBody(filteredData);
        renderDynamicPagination();
    } catch (err) {
        console.error('테이블 데이터 조회 오류:', err);
        tableBody.innerHTML = '<tr><td colspan="100">데이터를 불러오는 데 오류가 발생했습니다.</td></tr>';
    }
}

// 동적 테이블 헤더 렌더링
function renderDynamicTableHeader() {
    const tableHead = document.getElementById('dynamic-table-head');
    
    let html = '<tr>';
    tableColumns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr>';
    
    tableHead.innerHTML = html;
}

// 동적 테이블 바디 렌더링
function renderDynamicTableBody(data) {
    const tableBody = document.getElementById('dynamic-table-body');
    tableBody.innerHTML = '';
    
    data.forEach(row => {
        const tr = tableBody.insertRow();
        tableColumns.forEach(col => {
            const cell = tr.insertCell();
            const value = row[col];
            // null, undefined 처리
            cell.textContent = value !== null && value !== undefined ? value : '';
        });
    });
}

// 동적 테이블 페이지네이션 렌더링
function renderDynamicPagination() {
    const paginationContainer = document.getElementById('table-pagination');
    paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(dynamicTotalCount / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return;
    
    const maxVisiblePages = 10;
    const currentBlock = Math.ceil(currentDynamicPage / maxVisiblePages);
    const startPage = (currentBlock - 1) * maxVisiblePages + 1;
    const endPage = Math.min(currentBlock * maxVisiblePages, totalPages);
    
    // << 버튼
    const firstBtn = createPageButton('<<', 1);
    if (currentDynamicPage === 1) {
        firstBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(firstBtn);
    
    // < 버튼
    const prevBtn = createPageButton('<', currentDynamicPage - 1);
    if (currentDynamicPage === 1) {
        prevBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(prevBtn);
    
    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPageButton(i, i);
        if (i === currentDynamicPage) {
            pageBtn.classList.add('current-page');
        }
        paginationContainer.appendChild(pageBtn);
    }
    
    // > 버튼
    const nextBtn = createPageButton('>', currentDynamicPage + 1);
    if (currentDynamicPage === totalPages) {
        nextBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(nextBtn);
    
    // >> 버튼
    const lastBtn = createPageButton('>>', totalPages);
    if (currentDynamicPage === totalPages) {
        lastBtn.classList.add('disabled');
    }
    paginationContainer.appendChild(lastBtn);
}

// 초기 로드 코드 제거 (자동으로 데이터 로드하지 않음)
// document.querySelector('.menu-item[data-project="project1"]').click();

});