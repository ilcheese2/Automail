//begin modules/ALbuttonReload.js
if(useScripts.ALbuttonReload){
	let logo = document.querySelector("#nav .logo");
	if(logo){
		logo.onclick = function(){
			if(/\/home\/?$/.test(location.pathname)){//we only want this behaviour here
				window.location.reload(false);//reload page, but use cache if possible
			}
		}
	}
}

exportModule({
	id: "ALbuttonReload",
	description: "$ALbuttonReload_description",
	isDefault: true,
	categories: ["Navigation"],
	visible: true
})
//end modules/ALbuttonReload.js
//begin modules/accessTokenWarning.js
exportModule({
	id: "accessTokenWarning",
	description: "$accessTokenWarning_description",
	isDefault: false,
	importance: 0,
	categories: ["Login","Script"],
	visible: true
})

if(useScripts.accessTokenWarning && !useScripts.accessToken){
	accessTokenRetractedInfo()
}
//end modules/accessTokenWarning.js
//begin modules/addActivityLinks.js
async function addActivityLinks(activityID){
	async function arrowCallback(res){
		const {data, errors} = res;
		if(errors){
			return;
		}
		let adder = function(link){
			if(!location.pathname.includes("/activity/" + activityID)){
				return;
			}
			let activityLocation = document.querySelector(".activity-entry");
			if(activityLocation){
				activityLocation.appendChild(link);
				let status = document.querySelector(".status");
				if(useScripts.additionalTranslation && status){
					status = status.childNodes[0];
					let cont = status.textContent.trim().match(/(.+?)(\s(\d+|\d+ - \d+) of)/);
					if(cont){
						let prog = cont[3];
						let type = cont[1];
						if(document.querySelector(".activity-entry").classList.contains("activity-anime_list")){
							if(type === "Completed"){
								status.textContent = translate("$listActivity_completedAnime");
							}
							else if(type === "Watched episode" && prog){
								status.textContent = translate("$listActivity_MwatchedEpisode",prog);
							}
							else if(type === "Dropped" && prog){
								status.textContent = translate("$listActivity_MdroppedAnime",prog);
							}
							else if(type === "Dropped"){
								status.textContent = translate("$listActivity_droppedAnime");
							}
							else if(type === "Rewatched episode" && prog){
								status.textContent = translate("$listActivity_MrepeatingAnime",prog);
							}
							else if(type === "Rewatched"){
								status.textContent = translate("$listActivity_repeatedAnime");
							}
							else if(type === "Paused watching"){
								status.textContent = translate("$listActivity_pausedAnime");
							}
							else if(type === "Plans to watch"){
								status.textContent = translate("$listActivity_planningAnime");
							}
						}
						else if(document.querySelector(".activity-entry").classList.contains("activity-manga_list")){
							if(type === "Completed"){
								status.textContent = translate("$listActivity_completedManga");
							}
							else if(type === "Read chapter" && prog){
								status.textContent = translate("$listActivity_MreadChapter",prog);
							}
							else if(type === "Dropped" && prog){
								status.textContent = translate("$listActivity_MdroppedManga",prog);
							}
							else if(type === "Dropped"){
								status.textContent = translate("$listActivity_droppedManga");
							}
							else if(type === "Reread chapter" && prog){
								status.textContent = translate("$listActivity_MrepeatingManga",prog);
							}
							else if(type === "Reread"){
								status.textContent = translate("$listActivity_repeatedManga");
							}
							else if(type === "Paused reading"){
								status.textContent = translate("$listActivity_pausedManga");
							}
							else if(type === "Plans to read"){
								status.textContent = translate("$listActivity_planningManga");
							}
						}
						if(useScripts.partialLocalisationLanguage === "日本語"){
							status.parentNode.classList.add("hohReverseTitle")
						}
					}
				}
				return;
			}
			else{
				setTimeout(function(){adder(link)},200);
			}
		};
		let queryPrevious;
		let queryNext;
		let variables = {
			userId: data.Activity.userId || data.Activity.recipientId,
			createdAt: data.Activity.createdAt
		};
		if(data.Activity.type === "ANIME_LIST" || data.Activity.type === "MANGA_LIST"){
			variables.mediaId = data.Activity.media.id;
			queryPrevious = `
query ($userId: Int,$mediaId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		mediaId: $mediaId,
		createdAt_lesser: $createdAt,
		sort: ID_DESC
	){
		... on ListActivity{siteUrl createdAt id}
	}
}`;
			queryNext = `
query($userId: Int,$mediaId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		mediaId: $mediaId,
		createdAt_greater: $createdAt,
		sort: ID
	){
		... on ListActivity{siteUrl createdAt id}
	}
}`;
		}
		else if(data.Activity.type === "TEXT"){
			queryPrevious = `
query($userId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		type: TEXT,
		createdAt_lesser: $createdAt,
		sort: ID_DESC
	){
		... on TextActivity{siteUrl createdAt id}
	}
}`;
			queryNext = `
query($userId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		type: TEXT,
		createdAt_greater: $createdAt,
		sort: ID
	){
		... on TextActivity{siteUrl createdAt id}
	}
}`;
		}
		else if(data.Activity.type === "MESSAGE"){
			let link = create("a","hohPostLink","↑",false,"left:-25px;top:25px;");
			link.href = "/user/" + data.Activity.recipient.name + "/";
			link.title = translate("$navigation_profileLink",data.Activity.recipient.name);
			adder(link);
			variables.messengerId = data.Activity.messengerId;
			queryPrevious = `
query($userId: Int,$messengerId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		type: MESSAGE,
		messengerId: $messengerId,
		createdAt_lesser: $createdAt,
		sort: ID_DESC
	){
		... on MessageActivity{siteUrl createdAt id}
	}
}`;
			queryNext = `
query($userId: Int,$messengerId: Int,$createdAt: Int){
	Activity(
		userId: $userId,
		type: MESSAGE,
		messengerId: $messengerId,
		createdAt_greater: $createdAt,
		sort: ID
	){
		... on MessageActivity{siteUrl createdAt id}
	}
}`;
		}
		else{//unknown new types of activities
			return;
		}
		if(res.previous){
			if(res.previous !== "FIRST"){
				let link = create("a","hohPostLink","←",false,"left:-25px;");
				link.href = res.previous;
				link.rel = "prev";
				link.title = "Previous activity";
				adder(link);
			}
		}
		else{
			res.previous = "FIRST";
			const prevRes = await anilistAPI(queryPrevious, {variables});
			const {data: pdata, errors} = prevRes;
			if(!errors){
				let link = create("a","hohPostLink","←",false,"left:-25px;");
				link.title = "Previous activity";
				link.rel = "prev";
				link.href = pdata.Activity.siteUrl;
				adder(link);
				res.previous = pdata.Activity.siteUrl;
				updateCache("hohActivity" + activityID, res);
				pdata.Activity.type = data.Activity.type;
				pdata.Activity.userId = variables.userId;
				pdata.Activity.media = data.Activity.media;
				pdata.Activity.messengerId = data.Activity.messengerId;
				pdata.Activity.recipientId = data.Activity.recipientId;
				pdata.Activity.recipient = data.Activity.recipient;
				prevRes.next = document.URL;
				saveCache("hohActivity" + pdata.Activity.id, Object.assign(prevRes,{data: pdata}), 20*60*1000);
			}
		}
		if(res.next){
			let link = create("a","hohPostLink","→",false,"right:-25px;");
			link.href = res.next;
			link.rel = "next";
			link.title = "Next activity";
			adder(link);
		}
		else{
			const nextRes = await anilistAPI(queryNext, {variables});
			const {data: ndata, errors} = nextRes;
			if(errors){
				return;
			}
			let link = create("a","hohPostLink","→",false,"right:-25px;");
			link.href = ndata.Activity.siteUrl;
			link.rel = "next";
			link.title = "Next activity";
			adder(link);
			res.next = ndata.Activity.siteUrl;
			updateCache("hohActivity" + activityID, res);
			ndata.Activity.type = data.Activity.type;
			ndata.Activity.userId = variables.userId;
			ndata.Activity.media = data.Activity.media;
			ndata.Activity.messengerId = data.Activity.messengerId;
			ndata.Activity.recipientId = data.Activity.recipientId;
			ndata.Activity.recipient = data.Activity.recipient;
			nextRes.previous = document.URL;
			saveCache("hohActivity" + ndata.Activity.id, Object.assign(nextRes,{data: ndata}), 20*60*1000);
		}
		return
	}

	const dataQuery = `
query($id: Int){
	Activity(id: $id){
		... on ListActivity{
			type
			userId
			createdAt
			media{id}
		}
		... on TextActivity{
			type
			userId
			createdAt
		}
		... on MessageActivity{
			type
			recipientId
			recipient{name}
			messengerId
			createdAt
		}
	}
}`
	//has to be auth now that private messages are a thing
	const data = await anilistAPI(dataQuery, {
		variables: {id: activityID},
		cacheKey: "hohActivity" + activityID,
		duration: 20*60*1000,
		auth: true
	})
	return arrowCallback(data)
}
//end modules/addActivityLinks.js
//begin modules/addActivityTimeline.js
async function addActivityTimeline(){
	const URLstuff = location.pathname.match(/^\/(anime|manga)\/(\d+)(\/[\w-]*)?\/social/);
	if(!URLstuff){
		return
	}
	if(document.getElementById("activityTimeline")){
		return
	}
	if(!whoAmIid){
		const {data, errors} = await anilistAPI("query($name:String){User(name:$name){id}}", {
			variables: {name: whoAmI},
			cacheKey: "hohIDlookup" + whoAmI.toLowerCase(),
			duration: 5*60*1000
		});
		if(errors){
			return
		}
		whoAmIid = data.User.id;
		addActivityTimeline()
		return
	}
	let followingLocation = document.querySelector(".following");
	if(!followingLocation){
		setTimeout(addActivityTimeline,200);
		return
	}
	const status = document.querySelector(".actions .list .add").innerText;
	let activityTimeline = create("div","#activityTimeline",false,followingLocation.parentNode);
	let variables = {
		mediaId: URLstuff[2],
		userId: whoAmIid,
		page: 1
	};
	const query = `
query($userId: Int,$mediaId: Int,$page: Int){
	Page(page: $page){
		pageInfo{
			currentPage
			hasNextPage
		}
		activities(userId: $userId, mediaId: $mediaId, sort: ID){
			... on ListActivity{
				siteUrl
				createdAt
				status
				progress
				replyCount
			}
		}
	}
}`;
	let previousTime = null;
	const lineCaller = async function(query,variables){
		const data = await anilistAPI(query, {
			variables,
			cacheKey: `hohMediaTimeline${variables.mediaId}u${variables.userId}p${variables.page}`,
			duration: 120*1000
		});
		if(data.errors){
			return
		}
		if(data.data.Page.pageInfo.currentPage === 1){
			previousTime = null;
			removeChildren(activityTimeline)
			if(data.data.Page.activities.length){
				create("h2",false,translate("$timeline_title"),activityTimeline)
			}
		}
		data.data.Page.activities.forEach(function(activity){
			let diffTime = activity.createdAt - previousTime;
			if(previousTime && diffTime > 60*60*24*30*3){//three months
				create("div","hohTimelineGap","― " + formatTime(diffTime) + " ―",activityTimeline)
			}
			let activityEntry = create("div","hohTimelineEntry",false,activityTimeline);
			if(activity.replyCount){
				activityEntry.style.color = "rgb(var(--color-blue))"
			}
			let activityContext = create("a","newTab",capitalize(activity.status),activityEntry);
			if(URLstuff[1] === "manga"){
				if(activity.status === "read chapter" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MreadChapter_known",activity.progress))
				}
				else if(activity.status === "reread"){
					activityContext.innerText = capitalize(translate("$listActivity_repeatedManga_known"))
				}
				else if(activity.status === "reread chapter" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MrepeatingManga_known",activity.progress))
				}
				else if(activity.status === "dropped" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MdroppedManga_known",activity.progress))
				}
				else if(activity.status === "dropped"){
					activityContext.innerText = capitalize(translate("$listActivity_droppedManga_known",activity.progress))
				}
				else if(activity.status === "completed"){
					activityContext.innerText = capitalize(translate("$listActivity_completedManga_known"))
				}
				else if(activity.status === "plans to read"){
					activityContext.innerText = capitalize(translate("$listActivity_planningManga_known"))
				}
				else if(activity.status === "paused reading"){
					activityContext.innerText = capitalize(translate("$listActivity_pausedManga_known"))
				}
				else{
					console.warn("Missing listActivity translation key for:",activity.status)
				}
			}
			else{
				if(activity.status === "watched episode" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MwatchedEpisode_known",activity.progress))
				}
				else if(activity.status === "rewatched"){
					activityContext.innerText = capitalize(translate("$listActivity_repeatedAnime_known"))
				}
				else if(activity.status === "rewatched episode" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MrepeatingAnime_known",activity.progress))
				}
				else if(activity.status === "dropped" && activity.progress){
					activityContext.innerText = capitalize(translate("$listActivity_MdroppedAnime_known",activity.progress))
				}
				else if(activity.status === "dropped"){
					activityContext.innerText = capitalize(translate("$listActivity_droppedAnime_known",activity.progress))
				}
				else if(activity.status === "completed"){
					activityContext.innerText = capitalize(translate("$listActivity_completedAnime_known"))
				}
				else if(activity.status === "plans to watch"){
					activityContext.innerText = capitalize(translate("$listActivity_planningAnime_known"))
				}
				else if(activity.status === "paused watching"){
					activityContext.innerText = capitalize(translate("$listActivity_pausedAnime_known"))
				}
				else{
					console.warn("Missing listActivity translation key for:",activity.status)
				}
			}
			activityContext.href = activity.siteUrl;
			const options = {weekday: "short", year: "numeric", month: "short", day: "numeric"};
			let locale = languageFiles[useScripts.partialLocalisationLanguage].info.locale || "en-UK";
			let datestring = (new Date(activity.createdAt*1000)).toLocaleDateString(locale,options)
			create("span",false,
				" " + datestring,
				activityEntry
			).title = (new Date(activity.createdAt*1000)).toLocaleString();
			previousTime = activity.createdAt;
		});
		if(data.data.Page.pageInfo.hasNextPage === true){
			variables.page = data.data.Page.pageInfo.currentPage + 1;
			lineCaller(query,variables)
		}
		return
	};
	if(status !== "Add To List"){
		lineCaller(query,variables)
	}
	let lookingElse = create("div",false,false,followingLocation.parentNode,"margin-top:30px;");
	create("div",false,translate("$timeline_search_description"),lookingElse);
	let lookingElseInput = create("input",false,false,lookingElse);
	lookingElseInput.placeholder = translate("$input_user_placeholder");
	lookingElseInput.setAttribute("list","socialUsers");
	let lookingElseButton = create("button",["button","hohButton"],translate("$button_search"),lookingElse);
	let lookingElseError = create("span",false,"",lookingElse);
	lookingElseButton.onclick = async function(){
		if(lookingElseInput.value){
			lookingElseError.innerText = "...";
			const userName = lookingElseInput.value.trim();
			const {data, errors} = await anilistAPI("query($name:String){User(name:$name){id}}", {
				variables: {name: userName},
				cacheKey: "hohIDlookup" + userName.toLowerCase(),
				duration: 5*60*1000
			});
			if(errors){
				lookingElseError.innerText = translate("$error_userNotFound");
				return
			}
			lookingElseError.innerText = "";
			variables.userId = data.User.id;
			variables.page = 1;
			lineCaller(query,variables)
		}
		return
	}
	let favFindQuery = `query (
      $mediaId: Int,
      $page: Int
){
  Page (page: $page) {
    mediaList (mediaId: $mediaId, sort: SCORE_DESC) {
      scoreRaw: score(format: POINT_100) user {
        name favourites {${URLstuff[1]} {nodes {id}}
}}}}}
`;
	create("hr",false,false,followingLocation.parentNode);
	let findFavs = create("div",false,false,followingLocation.parentNode);
	let findFavsButton = create("button",["button","hohButton"],"People with this in favs",findFavs);
	findFavsButton.onclick = async function(){
		let resultsArea = create("div",false,false,findFavs);
		let searchStatus = create("div",false,"searching...",resultsArea);
		let searchResults = create("div",false,false,resultsArea);
		let userList = new Map();
		let caller = async function(page){
			const {data, errors} = await anilistAPI(favFindQuery, {
				variables: {page: page, mediaId: parseInt(URLstuff[2])},
				cacheKey: "hohFavFinder" + page + "id" + parseInt(URLstuff[2]),
				duration: 10*60*1000
			});
			if(errors){
				searchStatus.innerText = "error searching page " + page;
				return
			}
			else{
				searchStatus.innerText = "searching... page " + page;
				data.Page.mediaList.forEach(listing => {
					if(listing.user && listing.user.favourites){
						if(listing.user.favourites[URLstuff[1]].nodes.some(fav => fav.id === parseInt(URLstuff[2]))){
							userList.set(listing.user.name, {
								isFavourite: true,
								score: listing.scoreRaw,
								first: listing.user.favourites[URLstuff[1]].nodes[0].id === parseInt(URLstuff[2])
							})
						}
					}
				})
				removeChildren(searchResults);
				Array.from(userList).sort((b,a) => 
					(+a[1].first) - (+b[1].first)
					|| a[1].scoreRaw - b[1].scoreRaw
				).forEach(user => {
					let row = create("p",false,false,searchResults);
					create("a",false,user[0],row).href = "https://anilist.co/user/" + user[0];
					if(user[1].first){
						create("span",false," #1",row)
					}
				})
				if(data.Page.mediaList.length && (page < 15 || (userList.size < 3 && page < 20))){
					caller(page + 1)
				}
				else{
					if(userList.size === 0){
						searchStatus.innerText = "search completed. No users found."
					}
					else{
						searchStatus.innerText = "search completed."
					}
				}
			}
		}
		caller(1)
	}
}
//end modules/addActivityTimeline.js
//begin modules/addBrowseFilters.js
exportModule({
	id: "browseFilters",
	description: "$browseFilters_description",
	isDefault: true,
	categories: ["Browse"],
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/search\/(anime|manga)/.test(url);
	},
	code: function(){
		const customSorts = {
			TITLE_ROMAJI: "Title ↑",
			TITLE_ROMAJI_DESC: "Title ↓",
			POPULARITY_DESC: "Popularity ↓",
			POPULARITY: "Popularity ↑",
			SCORE_DESC: "Average Score ↓",
			SCORE: "Average Score ↑",
			TRENDING_DESC: "Trending",
			FAVOURITES_DESC: "Favorites",
			ID_DESC: "Date Added",
			START_DATE_DESC: "Release Date ↓",
			START_DATE: "Release Date ↑"
		};
		const customAnime = {EPISODES_DESC: "Episodes ↓", EPISODES: "Episodes ↑", DURATION_DESC: "Duration ↓", DURATION: "Duration ↑"};
		const customManga = {CHAPTERS_DESC: "Chapters ↓", CHAPTERS: "Chapters ↑", VOLUMES_DESC: "Volumes ↓", VOLUMES: "Volumes ↑"};
		const sorts = document.querySelector(".sort-wrap.sort-select");
		function addSorts(){
			const type = location.pathname.match(/^\/search\/(anime|manga)/)[1];
			Object.keys(sorts.__vue__.sortOptions).forEach(key => delete sorts.__vue__.sortOptions[key])
			Object.assign(sorts.__vue__.sortOptions, customSorts, type === "anime" ? customAnime : customManga)
		}
		setTimeout(addSorts,200);
	}
})
//end modules/addBrowseFilters.js
//begin modules/addComparisionPage.js
//TODO: many of the separate arrays here should really be a single array of objects instead
function addComparisionPage(){
	let URLstuff = document.URL.match(/^https:\/\/anilist\.co\/user\/(.*)\/(anime|manga)list\/compare/);
	if(!URLstuff){
		return
	}
	let userA = decodeURIComponent(URLstuff[1]);
	let type = URLstuff[2];
	let compareLocation = document.querySelector(".compare");
	let nativeCompareExists = true;
	if(!compareLocation){
		nativeCompareExists = false;
		compareLocation = document.querySelector(".medialist");
		if(!compareLocation){
			setTimeout(addComparisionPage,200);
			return
		}
	}
	if(document.querySelector(".hohCompare")){
		return
	}
	compareLocation.style.display = "none";
	let compareArea = create("div","hohCompare",false,compareLocation.parentNode);
	if(nativeCompareExists){
		let isDefaultCompare = false;
		let switchButton = create("span","hohCompareUIfragment",translate("$compare_default"),compareLocation.parentNode,"position:absolute;top:0px;right:0px;cursor:pointer;z-index:100;");
		switchButton.onclick = function(){
			isDefaultCompare = !isDefaultCompare;
			if(isDefaultCompare){
				switchButton.innerText = translate("$compare_hoh");
				compareLocation.style.display = "";
				compareArea.style.display = "none";
				switchButton.style.top = "-30px"
			}
			else{
				switchButton.innerText = translate("$compare_default");
				compareLocation.style.display = "none";
				compareArea.style.display = "";
				switchButton.style.top = "0px"
			}
		};
		compareLocation.parentNode.style.position = "relative"
	}
	let guideLabel = create("p",false,"Usage guide",compareArea,"cursor:pointer;color:rgb(var(--color-blue))");
	guideLabel.onclick = function(){
		let scrollableContent = createDisplayBox("min-width:600px;width:700px;z-index:9000");
		create("h3",false,"What is this?",scrollableContent);
		create("p",false,"This is a tool for comparing the ratings of two or more users. To add another user, write their name and click the 'add' button in the rightmost colum",scrollableContent);
		create("h3",false,"General options",scrollableContent);
		create("p",false,"Filter: What media type to include.",scrollableContent);
		create("p",false,"Min. ratings: How many of the users in the table must have given something a rating for it to appear in the table.",scrollableContent);
		create("p",false,"Individual rating systems: By default, all ratings are converted to the 1-100 scale. When you override this, ratings appear as smiley faces, 1-10 points, stars, or whatver else people use. A golden star next to the rating means the user has this on their favourite list.",scrollableContent);
		create("p",false,"Normalise ratings: Converts ratings to a unified scale based on their average and rating spread.",scrollableContent);
		create("p",false,"Colour entire cell: Cell colour shows users media status (completed, watching, etc.)",scrollableContent);
		create("h3",false,"Aggregate column",scrollableContent);
		create("p",false,"Shows 'average' by default. Other settings of interest: 'Average~0' adds a 0 score to every average, making the score more pessimistic towards entries few people have rated.",scrollableContent);
		create("p",false,"'#' means number, '$' means global stats",scrollableContent);
		create("h3",false,"User filters",scrollableContent);
		create("p",false,"List filters, click to cycle through",scrollableContent);
		create("span","hohFilterSort","☵",scrollableContent);
		create("span",false,"Neutral. This user doesn't affect what media gets displayed.",scrollableContent);
		create("br",false,false,scrollableContent);
		create("br",false,false,scrollableContent);
		create("span","hohFilterSort","✓",scrollableContent,"color:green");
		create("span",false,"Only display media this person has rated",scrollableContent);
		create("br",false,false,scrollableContent);
		create("br",false,false,scrollableContent);
		create("span","hohFilterSort","✕",scrollableContent,"color:red");
		create("span",false,"Only display media this person has NOT rated (mark yourself with this to find recommendations)",scrollableContent);
		create("br",false,false,scrollableContent);
		create("p",false,"Status filters (tiny dot). Click to cycle through (reading, dropped, not on list, etc.)",scrollableContent);
	}
	let formatFilterLabel = create("span",false,"Filter:",compareArea);
	formatFilterLabel.style.padding = "5px";
	let formatFilter = create("select","hohNativeInput",false,compareArea);
	let addOption = function(value,text){
		let newOption = create("option",false,text,formatFilter);
		newOption.value = value
	};
	addOption("all","All");
	if(type === "anime"){
		addOption("TV","TV");
		addOption("MOVIE","Movie");
		addOption("TV_SHORT","TV Short");
		addOption("OVA","OVA");
		addOption("ONA","ONA");
		addOption("SPECIAL","Special");
		addOption("MUSIC","Music");
	}
	else if(type === "manga"){
		addOption("MANGA","Manga");
		addOption("NOVEL","Novel");
		addOption("ONE_SHOT","One Shot");
		addOption("MANHWA","Manhwa");
		addOption("MANHUA","Manhua");
	}
	let ratingFilterLabel = create("span",false,translate("$compare_minRatings"),compareArea);
	ratingFilterLabel.style.padding = "5px";
	let ratingFilter = create("input","hohNativeInput",false,compareArea,"width:45px;color:rgb(var(--color-text))");
	ratingFilter.type = "number";
	ratingFilter.value = 1;
	ratingFilter.min = 0;
	let systemFilterLabel = create("span",false,translate("$compare_individualRatings"),compareArea,"padding:5px;");
	let systemFilter = createCheckbox(compareArea);
	systemFilter.checked = useScripts.comparisionSystemFilter;
	let normalFilterLabel = create("span",false,translate("$compare_normalizeRatings"),compareArea,"padding:5px;");
	let normalFilter = createCheckbox(compareArea);
	normalFilter.checked = false;
	let colourLabel = create("span",false,translate("$compare_colourCell"),compareArea,"padding:5px;");
	let colourFilter = createCheckbox(compareArea);
	colourFilter.checked = useScripts.comparisionColourFilter;	
	let sequelLabel = create("span",false,translate("$hideSequels"),compareArea,"padding:5px;");
	let sequelFilter = createCheckbox(compareArea);
	sequelFilter.checked = false;
	if(type === "manga"){
		sequelLabel.style.display = "none";
		sequelFilter.parentNode.style.display = "none"
	}
	let tableContainer = create("table",false,false,compareArea);
	let table = create("tbody",false,false,tableContainer);
	let digestSelect = {value:"average"};//placeholder
	let digestValue = "average";
	let shows = [];//the stuff we are displaying in the table
	let users = [];
	let listCache = {};//storing raw anime data
	let ratingMode = "average";let guser = 0;let inverse = false;
	let csvButton = create("button",["csvExport","button","hohButton","hohCompareUIfragment"],"CSV data",compareLocation.parentNode,"margin-top:10px;");
	let jsonButton = create("button",["jsonExport","button","hohButton","hohCompareUIfragment"],"JSON data",compareLocation.parentNode,"margin-top:10px;");
	csvButton.onclick = function(){
		let csvContent = "Title," + digestSelect.selectedOptions[0].text + "," + users.map(user => user.name).join(",") + "\n";
		shows.forEach(function(show){
			let display = users.every(function(user,index){
				if(user.demand === 1 && show.score[index] === 0){
					return false
				}
				else if(user.demand === -1 && show.score[index] !== 0){
					return false
				}
				return (!user.status || show.status[index] === user.status);
			});
			if(formatFilter.value !== "all"){
				if(formatFilter.value !== show.format){
					display = false
				}
			}
			if(show.numberWatched < ratingFilter.value){
				display = false;
			}
			if(!display){
				return
			}
			csvContent += csvEscape(show.title) + "," + show.digest + "," + show.score.join(",") + "\n"
		});
		let filename = capitalize(type) + " table";
		if(users.length === 1){
			filename += " for " + users[0].name
		}
		else if(users.length === 2){
			filename += " for " + users[0].name + " and " + users[1].name
		}
		else if(users.length > 2){
			filename += " for " + users[0].name + ", " + users[1].name + " and others"
		}
		filename += ".csv";
		saveAs(csvContent,filename,true)
	};
	jsonButton.onclick = function(){
		let jsonData = {
			users: users,
			formatFilter: formatFilter.value,
			digestValue: digestSelect.value,
			type: capitalize(type),
			version: "1.1",
			description: "Anilist media list comparision",
			scriptInfo: scriptInfo,
			url: document.URL,
			timeStamp: NOW(),
			media: shows
		}
		let filename = capitalize(type) + " table";
		if(users.length === 1){
			filename += " for " + users[0].name
		}
		else if(users.length === 2){
			filename += " for " + users[0].name + " and " + users[1].name
		}
		else if(users.length > 2){
			filename += " for " + users[0].name + ", " + users[1].name + " and others"
		}
		filename += ".json";
		saveAs(jsonData,filename)
	}
	let sortShows = function(){
		let averageCalc = function(scoreArray,weight){//can maybe be delegated to the stats object? look into later
			let sum = 0;
			let dividents = 0;
			scoreArray.forEach(function(score){
				if(score !== null){
					sum += score;
					dividents++
				}
			});
			return {
				average: ((dividents + (weight || 0)) ? (sum/(dividents + (weight || 0))) : null),
				dividents: dividents
			}
		};
		let scoreField = (normalFilter.checked ? "scoreNormal" : "score");
		let sortingModes = {
			"average": function(show){
				show.digest = averageCalc(show[scoreField]).average
			},
			"average0": function(show){
				show.digest = averageCalc(show[scoreField],1).average
			},
			"standardDeviation": function(show){
				let average = averageCalc(show[scoreField]);
				let variance = 0;
				show.digest = null;
				if(average.dividents > 1){
					show[scoreField].forEach(score => {
						if(score !== null){
							variance += Math.pow(score - average.average,2)
						}
					});
					variance = variance/average.dividents;
					show.digest = Math.sqrt(variance)
				}
			},
			"absoluteDeviation": function(show){
				let average = averageCalc(show[scoreField]);
				let variance = 0;
				show.digest = null;
				if(average.dividents > 1){
					show[scoreField].forEach(score => {
						if(score !== null){
							variance += Math.abs(score - average.average)
						}
					});
					variance = variance/average.dividents;
					show.digest = variance
				}
			},
			"max": function(show){
				let newScores = show[scoreField].filter(score => score !== null);
				if(newScores.length){
					show.digest = Math.max(...newScores)
				}
				else{
					show.digest = null
				}
			},
			"min": function(show){
				let newScores = show[scoreField].filter(score => score !== null);
				if(newScores.length){
					show.digest = Math.min(...newScores)
				}
				else{
					show.digest = null
				}
			},
			"difference": function(show){
				if(show[scoreField].filter(score => score !== null).length){
					let mini = Math.min(...show[scoreField].filter(score => score !== null)) || 0;
					let maks = Math.max(...show[scoreField].filter(score => score !== null));
					show.digest = maks - mini
				}
				else{
					show.digest = null
				}
			},
			"ratings": function(show){
				show.digest = show[scoreField].filter(score => score !== null).length || null
			},
			"planned": function(show){
				show.digest = show.status.filter(value => value === "PLANNING").length || null
			},
			"current": function(show){
				show.digest = show.status.filter(value => (value === "CURRENT" || value === "REPEATING")).length || null
			},
			"favourites": function(show){
				show.digest = show.favourite.filter(TRUTHY).length || null
			},
			"median": function(show){
				let newScores = show[scoreField].filter(score => score !== null);
				if(newScores.length === 0){
					show.digest = null
				}
				else{
					show.digest = Stats.median(newScores)
				}
			},
			"popularity": function(show){
				show.digest = show.popularity
			},
			"averageScore": function(show){
				show.digest = show.averageScore
			},
			"averageScoreDiff": function(show){
				if(!show.averageScore){
					show.digest = 0;
					return
				}
				show.digest = averageCalc(show[scoreField]).average - show.averageScore
			}
		};
		if(ratingMode === "user"){
			shows.sort(
				(a,b) => b.score[guser] - a.score[guser]
			)
		}
		else if(ratingMode === "userInverse"){
			shows.sort(
				(b,a) => b.score[guser] - a.score[guser]
			)
		}
		else if(ratingMode === "title"){
			shows.sort(ALPHABETICAL(a => a.title))
		}
		else if(ratingMode === "titleInverse"){
			shows = shows.sort(ALPHABETICAL(a => a.title)).reverse()
		}
		else{
			shows.forEach(sortingModes[ratingMode]);
			if(inverse){
				shows.sort((b,a) => b.digest - a.digest)
			}
			else{
				shows.sort((a,b) => b.digest - a.digest)
			}
		}
	};
	let drawTable = function(){
		while(table.childElementCount > 2){
			table.lastChild.remove()
		}
		let columnAmounts = [];
		users.forEach(function(element){
			columnAmounts.push({sum:0,amount:0})
		})
		shows.forEach(function(show){
			let display = users.every(function(user,index){
				if(user.demand === 1 && !show.score[index]){
					return false
				}
				else if(user.demand === -1 && show.score[index]){
					return false
				}
				return (!user.status || show.status[index] === user.status);
			});
			if(formatFilter.value !== "all"){
				if(formatFilter.value !== show.format && !((formatFilter.value === "MANHWA" && show.country === "KR") || (formatFilter.value === "MANHUA" && show.country === "CN"))){
					return
				}
			}
			if(show.numberWatched < ratingFilter.value){
				return
			}
			if(sequelFilter.checked && sequelList.has(show.id)){
				return
			}
			if(!display){
				return
			}
			let row = create("tr","hohAnimeTable");
			row.onclick = function(){
				if(this.style.background === "rgb(var(--color-blue),0.5)"){
					this.style.background = "unset"
				}
				else{
					this.style.background = "rgb(var(--color-blue),0.5)"
				}
			}
			let showID = create("td",false,false,false,"max-width:250px;");
			create("a","newTab",show.title,showID)
				.href = show.url;
			let showAverage = create("td");
			if(show.digest !== null){
				let fractional = show.digest % 1;
				showAverage.innerText = show.digest.roundPlaces(3);
				[
					{s:"½",v:1/2},
					{s:"⅓",v:1/3},
					{s:"¼",v:1/4},
					{s:"¾",v:3/4},
					{s:"⅔",v:2/3},
					{s:"⅙",v:1/6},
					{s:"⅚",v:5/6},
					{s:"⅐",v:1/7}
				].find(symbol => {
					if(Math.abs(fractional - symbol.v) < 0.0001){
						showAverage.innerText = Math.floor(show.digest) + " " + symbol.s;
						return true
					}
					return false
				})
			}
			row.appendChild(showID);
			row.appendChild(showAverage);
			for(var i=0;i<show.score.length;i++){
				let showUserScore = create("td",false,false,row);
				if(show.score[i]){
					if(systemFilter.checked){
						showUserScore.appendChild(scoreFormatter(
							show.scorePersonal[i],
							users[i].system
						))
					}
					else if(normalFilter.checked){
						showUserScore.innerText = show.scoreNormal[i].roundPlaces(3)
					}
					else{
						showUserScore.innerText = show.score[i]
					}
					columnAmounts[i].sum += show.score[i];
					columnAmounts[i].amount++
				}
				else{
					if(show.status[i] === "NOT"){
						showUserScore.innerText = " "
					}
					else{
						showUserScore.innerText = "–"//n-dash
					}
				}
				if(show.status[i] !== "NOT"){
					if(colourFilter.checked){
						showUserScore.style.backgroundImage = "linear-gradient(to right,rgb(0,0,0,0)," + distributionColours[show.status[i]] + ")";
					}
					else{
						let statusDot = create("div","hohStatusDot",false,showUserScore);
						statusDot.style.background = distributionColours[show.status[i]];
						statusDot.title = show.status[i].toLowerCase();
					}
				}
				if(show.progress[i]){
					create("span","hohStatusProgress",show.progress[i],showUserScore)
				}
				if(show.favourite[i]){
					let favStar = create("span",false,false,showUserScore,"color:gold;font-size:1rem;vertical-align:middle;padding-bottom:2px;");
					favStar.appendChild(svgAssets2.star.cloneNode(true))
				}
			}
			table.appendChild(row);
		});
		if(columnAmounts.some(amount => amount.amount > 0)){
			let lastRow = create("tr",false,false,table);
			create("td",false,"Average",lastRow,"border-left-width: 1px;padding-left: 15px;font-weight: bold;");
			create("td",false,false,lastRow);
			columnAmounts.forEach(amount => {
				let averageCel = create("td",false,"–",lastRow);
				if(amount.amount){
					averageCel.innerText = (amount.sum/amount.amount).roundPlaces(2)
				}
			})
		}
	};
	let changeUserURL = function(){
		const baseState = location.protocol + "//" + location.host + location.pathname;
		let params = "";
		if(users.length){
			params += "&users=" + users.map(user => user.name + (user.demand ? (user.demand === -1 ? "-" : "*") : "")).join(",")
		}
		if(formatFilter.value !== "all"){
			params += "&filter=" + encodeURIComponent(formatFilter.value)
		}
		if(ratingFilter.value !== 1){
			params += "&minRatings=" + encodeURIComponent(ratingFilter.value)
		}
		if(systemFilter.checked){
			params += "&ratingSystems=true"
		}
		if(normalFilter.checked){
			params += "&normalizeRatings=true"
		}
		if(colourFilter.checked){
			params += "&fullColour=true"
		}
		if(ratingMode !== "average"){
			params += "&sort=" + ratingMode
		}
		if(params.length){
			params = "?" + params.substring(1)
		}
		current = baseState + params;
		history.replaceState({},"",baseState + params)
	};
	let drawUsers = function(){
		removeChildren(table)
		let userRow = create("tr");
		let resetCel = create("td",false,false,userRow);
		let resetButton = create("button",["hohButton","button"],translate("$button_reset"),resetCel,"margin-top:0px;");
		resetButton.onclick = function(){
			users = [];
			shows = [];
			drawUsers();
			changeUserURL()
		};
		let digestCel = create("td");
		digestSelect = create("select");
		let addOption = (value,text,title) => {
			let option = create("option",false,text,digestSelect);
			option.value = value;
			if(title){
				option.title = title
			}
		};
		addOption("average","Average");
		addOption("median","Median");
		addOption("average0","Average~0","Zero-weighted average. Good for sorting by 'best'");
		addOption("min","Minimum");
		addOption("max","Maximum");
		addOption("difference","Difference","Highest rating minus lowest rating");
		addOption("standardDeviation","Std. Deviation");
		addOption("absoluteDeviation","Abs. Deviation");
		addOption("ratings","#Ratings","Sort by number of users in table who have given a rating");
		addOption("planned","#Planning","Sort by number of users in table who have this as planning");
		addOption("current","#Current","Sort by number of users in table who have this as current");
		addOption("favourites","#Favourites","Sort by number of users in table who have this as a favourite");
		addOption("popularity","$Popularity","Sort by site-wide popularity");
		addOption("averageScore","$Score","Sort by site-wide score");
		addOption("averageScoreDiff","$Score diff.","Sort by difference between site-wide score and average score of the users in the table");
		if(["title","titleInverse","user","userInverse"].includes(ratingMode)){
			digestSelect.value = ratingMode;
		}
		if(digestValue){
			digestSelect.value = digestValue
		}
		digestSelect.oninput = function(){
			ratingMode = digestSelect.value;
			digestValue = digestSelect.value;
			sortShows();
			drawTable();
			changeUserURL()
		};
		digestCel.appendChild(digestSelect);
		userRow.appendChild(digestCel);
		users.forEach(function(user,index){
			let userCel = create("td",false,false,userRow);
			let avatar = create("img",false,false,userCel);
			avatar.src = listCache[user.name].data.MediaListCollection.user.avatar.medium;
			let name = create("span",false,user.name,userCel);
			name.style.padding = "8px";
			let remove = create("span","hohAnimeTableRemove","✕",userCel);
			remove.onclick = function(){
				deleteUser(index)
			}
		});
		let addCel = create("td");
		let addInput = create("input","hohNativeInput",false,addCel);
		let addButton = create("button",["button","hohButton"],translate("$button_add"),addCel,"margin-top:0px;");
		addButton.style.cursor = "pointer";
		addButton.onclick = function(){
			if(addInput.value !== ""){
				addUser(addInput.value);
				addButton.innerText = "...";
				addButton.disabled = true;
				setTimeout(function(){//prevent double click, but don't soft lock on lookup failure
					if(addButton.disabled){
						addButton.disabled = false
						addMALButton.innerText = translate("$button_add");
					}
				},5000)
			}
		};
		let addMALButton = create("button",["button","hohButton"],"Add MAL",addCel,"margin-top:0px;");
		addMALButton.style.cursor = "pointer";
		addMALButton.onclick = function(){
			if(addInput.value !== ""){
				addUser(addInput.value, null, true);
				addMALButton.innerText = "...";
				addMALButton.disabled = true;
				setTimeout(function(){//prevent double click, but don't soft lock on lookup failure
					if(addMALButton.disabled){
						addMALButton.disabled = false
						addMALButton.innerText = translate("Add MAL");
					}
				},5000)
			}
		};
		userRow.appendChild(addCel);
		let headerRow = create("tr");
		let typeCel = create("th",false,false,headerRow);
		let downArrowa = create("span","hohArrowSort","▼",typeCel);
		downArrowa.onclick = function(){
			ratingMode = "title";
			sortShows();
			drawTable()
		};
		let typeCelLabel = create("span",false,capitalize(type),typeCel);
		let upArrowa = create("span","hohArrowSort","▲",typeCel);
		upArrowa.onclick = function(){
			ratingMode = "titleInverse";
			sortShows();
			drawTable()
		};
		let digestSortCel = create("td");
		digestSortCel.style.textAlign = "center";
		let downArrow = create("span","hohArrowSort","▼",digestSortCel);
		downArrow.onclick = function(){
			ratingMode = digestSelect.value;
			inverse = false;
			sortShows(digestSelect.value);
			drawTable()
		};
		let upArrow = create("span","hohArrowSort","▲",digestSortCel);
		upArrow.onclick = function(){
			ratingMode = digestSelect.value;
			inverse = true;
			sortShows();
			drawTable()
		};
		headerRow.appendChild(digestSortCel);
		users.forEach(function(user,index){
			let userCel = create("td");
			userCel.style.textAlign = "center";
			userCel.style.position = "relative";
			let filter = create("span");
			if(user.demand === 0){
				filter.innerText = "☵"
			}
			else if(user.demand === 1){
				filter.innerText = "✓";
				filter.style.color = "green"
			}
			else{
				filter.innerText = "✕";
				filter.style.color = "red"
			}
			filter.classList.add("hohFilterSort");
			filter.onclick = function(){
				if(filter.innerText === "☵"){
					filter.innerText = "✓";
					filter.style.color = "green";
					user.demand = 1
				}
				else if(filter.innerText === "✓"){
					filter.innerText = "✕";
					filter.style.color = "red";
					user.demand = -1
				}
				else{
					filter.innerText = "☵";
					filter.style.color = "";
					user.demand = 0
				}
				drawTable();
				changeUserURL()
			};
			let downArrow = create("span","hohArrowSort","▼");
			downArrow.onclick = function(){
				ratingMode = "user";
				let active = headerRow.querySelector(".hohArrowSelected");
				if(active){
					active.classList.remove("hohArrowSelected")
				}
				downArrow.classList.add("hohArrowSelected")
				guser = index;
				sortShows();
				drawTable()
			};
			let upArrow = create("span","hohArrowSort","▲");
			upArrow.onclick = function(){
				ratingMode = "userInverse";
				let active = headerRow.querySelector(".hohArrowSelected");
				if(active){
					active.classList.remove("hohArrowSelected")
				}
				upArrow.classList.add("hohArrowSelected")
				guser = index;
				sortShows();
				drawTable()
			};
			let statusFilterDot = create("div","hohStatusDot");
			if(user.status === false){
				statusFilterDot.title = translate("$compare_listStatus")
			}
			const stati = ["COMPLETED","CURRENT","PLANNING","PAUSED","DROPPED","REPEATING","NOT"];
			statusFilterDot.onclick = function(){
				if(user.status === "NOT"){
					user.status = false;
					statusFilterDot.style.background = "rgb(var(--color-background))";
					statusFilterDot.title = translate("$compare_listStatus")
				}
				else if(user.status === "REPEATING"){
					user.status = "NOT";
					statusFilterDot.style.background = `center / contain no-repeat url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="96" height="96" viewBox="0 0 10 10"><line stroke="red" x1="0" y1="0" x2="10" y2="10"/><line x1="0" y1="10" x2="10" y2="0" stroke="red"/></svg>')`;
					statusFilterDot.title = "no status";
				}
				else if(user.status === false){
					user.status = "COMPLETED";
					statusFilterDot.style.background = distributionColours["COMPLETED"];
					statusFilterDot.title = "completed"
				}
				else{
					user.status = stati[stati.indexOf(user.status) + 1];
					statusFilterDot.style.background = distributionColours[user.status];
					statusFilterDot.title = user.status.toLowerCase()
				}
				drawTable()
			};
			userCel.appendChild(downArrow);
			userCel.appendChild(filter);
			userCel.appendChild(upArrow);
			userCel.appendChild(statusFilterDot);
			headerRow.appendChild(userCel);
		});
		userRow.classList.add("hohUserRow");
		headerRow.classList.add("hohHeaderRow");
		table.appendChild(userRow);
		table.appendChild(headerRow)
	};
	let addUser = async function(userName,paramDemand, isMAL){
		let handleData = function(data,cached){
			users.push({
				name: userName,
				id: data.data.MediaListCollection.user.id,
				demand: (paramDemand ? (paramDemand === "-" ? -1 : 1) : 0),
				system: data.data.MediaListCollection.user.mediaListOptions.scoreFormat,
				status: false
			});
			let list = returnList(data,false);
			if(!cached){
				let averageSum = 0;
				let averageCount = 0;
				list.forEach(alia => {
					alia.media.id = alia.mediaId;
					alia.media.title = titlePicker(alia.media);
					alia.scoreRaw = convertScore(alia.score,data.data.MediaListCollection.user.mediaListOptions.scoreFormat) || 0;
					if(alia.scoreRaw){
						averageSum += alia.scoreRaw;
						averageCount++
					}
				});
				averageSum = averageSum/averageCount;
				let varianceSum = 0;
				list.forEach(alia => {
					if(alia.scoreRaw){
						varianceSum += Math.pow(alia.scoreRaw - averageSum,2)
					}
				})
				let std = Math.sqrt(varianceSum/averageCount);
				list.forEach(alia => {
					if(alia.scoreRaw){
						alia.scoreNormal = (alia.scoreRaw - averageSum)/std
					}
					else{
						alia.scoreNormal = null
					}
				})
			}
			shows.sort(function(a,b){return a.id - b.id});
			let listPointer = 0;
			let userIndeks = 0;
			if(shows.length){
				userIndeks = shows[0].score.length
			}

			let favs = []
			if (data.data.MediaListCollection.user.favourites) {
					favs = data.data.MediaListCollection.user.favourites.fav.nodes.concat(
					data.data.MediaListCollection.user.favourites.fav2.nodes
				).concat(
					data.data.MediaListCollection.user.favourites.fav3.nodes
				).map(media => media.idMal);
			}
			let createEntry = function(mediaEntry){
				let entry = {
					id: mediaEntry.mediaId,
					average: mediaEntry.scoreRaw,
					title: mediaEntry.media.title,
					format: mediaEntry.media.format,
					country: mediaEntry.media.countryOfOrigin,
					score: Array(userIndeks).fill(null),
					scorePersonal: Array(userIndeks).fill(null),
					scoreNormal: Array(userIndeks).fill(null),
					status: Array(userIndeks).fill("NOT"),
					progress: Array(userIndeks).fill(false),
					numberWatched: mediaEntry.scoreRaw ? 1 : 0,
					favourite: Array(userIndeks).fill(false),
					averageScore: mediaEntry.media.averageScore,
					popularity: mediaEntry.media.popularity,
					url: mediaEntry.media.siteUrl
				};
				entry.score.push(mediaEntry.scoreRaw || null);
				entry.scorePersonal.push(mediaEntry.score || null);
				entry.scoreNormal.push(mediaEntry.scoreNormal);
				entry.status.push(mediaEntry.status);
				if(mediaEntry.status !== "PLANNING" && mediaEntry.status !== "COMPLETED"){
					entry.progress.push(mediaEntry.progress + "/" + (mediaEntry.media.chapters || mediaEntry.media.episodes || ""))
				}
				else{
					entry.progress.push(false)
				}
				entry.favourite.push(favs.includes(entry.id));
				return entry
			};
			shows.forEach(show => {
				show.score.push(null);
				show.scorePersonal.push(null);
				show.scoreNormal.push(null);
				show.status.push("NOT");
				show.progress.push(false);
				show.favourite.push(false)
			});
			for(var i=0;i<shows.length && listPointer < list.length;i++){
				if(shows[i].id < list[listPointer].mediaId){
					continue
				}
				else if(shows[i].id === list[listPointer].mediaId){
					shows[i].score[userIndeks] = list[listPointer].scoreRaw || null;
					shows[i].scorePersonal[userIndeks] = list[listPointer].score || null;
					shows[i].scoreNormal[userIndeks] = list[listPointer].scoreNormal;
					shows[i].status[userIndeks] = list[listPointer].status;
					if(list[listPointer].scoreRaw){
						shows[i].numberWatched++
					}
					if(list[listPointer].status !== "PLANNING" && list[listPointer].status !== "COMPLETED"){
						shows[i].progress[userIndeks] =
							list[listPointer].progress
							+ "/"
							+ (
								list[listPointer].media.chapters
								|| list[listPointer].media.episodes
								|| ""
							)
					}
					else{
						shows[i].progress[userIndeks] = false
					}
					shows[i].favourite[userIndeks] = favs.includes(shows[i].id);
					listPointer++
				}
				else{
					shows.splice(i,0,createEntry(list[listPointer]));
					listPointer++
				}
			}
			for(;listPointer < list.length;listPointer++){
				shows.push(createEntry(list[listPointer]))
			}
			sortShows();
			drawUsers();
			drawTable();
			changeUserURL()
		};
		let convertMAL = function(malData){
			let data = {
				MediaListCollection: {
					lists: [
						{entries: []}
					],
					user: {
						mediaListOptions: {
							scoreFormat: "POINT_10"
						},
						id: -1,
						avatar: {
							medium: "https://dzinejs.lv/wp-content/plugins/lightbox/images/No-image-found.jpg"
						},
						favourites: {
							fav: {
								nodes: []
							},
							fav2: {
								nodes: []
							},
							fav3: {
								nodes: []
							}
						}
					},
				},
				errors: null
			};
			malData.data.forEach((show => {
				const MAL_TO_ANILIST_FORMAT = {
					"unknown": "TV",
					"tv": "TV",
					"ova": "OVA",
					"movie": "MOVIE",
					"special": "SPECIAL",
					"ona": "ONA",
					"music": "MUSIC"
				};
				const MAL_TO_ANILIST_STATUS = {
					"watching": "CURRENT",
					"completed": "COMPLETED",
					"on_hold": "PAUSED",
					"dropped": "DROPPED",
					"plan_to_watch": "PLANNING"
				};
				
				const media = {
					averageScore: (show.node.mean * 10).toFixed() * 1.0,
					chapters: null, // no such thing
					countryOfOrigin: "JP",
					episodes: show.node.num_episodes,
					format: MAL_TO_ANILIST_FORMAT[show.node.media_type],
					idMal: show.node.id,
					popularity: show.node.num_list_users,
					title: {
						romaji: show.node.title,
						native: show.node.title.ja, // chinese show had ja field
						english: show.node.alternative_titles.en
					},
					siteUrl: `https://myanimelist.net/anime/${show.node.id}/`
				};
				data.MediaListCollection.lists[0].entries.push({
					media: media,
					mediaId: show.node.id,
					progress: show.list_status.num_episodes_watched,
					score: show.list_status.score,
					status: show.list_status.is_rewatching ? "REPEATING" : MAL_TO_ANILIST_STATUS[show.list_status.status]
				});
				
			}));
			return {data: data};
		};
		if(hasOwn(listCache, userName)){
			handleData(listCache[userName],true)
		}
		else{
			const listQuery = `
query($name: String, $listType: MediaType){
	MediaListCollection(userName: $name, type: $listType){
		lists{
			entries{
			... mediaListEntry
			}
		}
		user{
			id
			name
			avatar{medium}
			mediaListOptions{scoreFormat}
			favourites{
				fav:${type.toLowerCase()}(page:1){
					nodes{
						idMal
					}
				}
				fav2:${type.toLowerCase()}(page:2){
					nodes{
						idMal
					}
				}
				fav3:${type.toLowerCase()}(page:3){
					nodes{
						idMal
					}
				}
			}
		}
	}
}

fragment mediaListEntry on MediaList{
	mediaId
	status
	progress
	score
	media{
		idMal
		episodes
		chapters
		format
		title{romaji native english}
		averageScore
		popularity
		countryOfOrigin
		siteUrl
	}
}`

			let data = null;
			let request = { 
				url : `https://api.myanimelist.net/v2/users/${userName}/animelist?limit=100&fields=list_status,num_episodes,media_type,alternative_titles,mean,num_list_users`,
				headers: {
					  "X-MAL-CLIENT-ID":"b7370c0364d21f82f91aef2531b6f275"
				}
			};

			if (isMAL) {
				let response = await GM.xmlHttpRequest(request).catch(e => console.error(e));
				if (response.status != 200) {
					return;
				}
				let curr = JSON.parse(response.responseText);
				data = curr;
				while (curr.paging.next) {
					request.url = curr.paging.next;
					response = await GM.xmlHttpRequest(request).catch(e => console.error(e));
					if (response.status != 200) {
						break;
					}
					curr = JSON.parse(response.responseText);
					data.data = data.data.concat(curr.data);
				}
				data = convertMAL(data);

				const response2 = await GM.xmlHttpRequest({ 
					url : `https://api.jikan.moe/v4/users/${userName}/`,
				}).catch(e => console.error(e));
				if (response2.status == 200) {
					const profile = JSON.parse(response2.responseText);
					data.data.MediaListCollection.user.id = profile.data.mal_id;
					if (profile.data.images.jpg) {
						data.data.MediaListCollection.user.avatar.medium = profile.data.images.jpg.image_url;
					}	
				}

				const response3 = await GM.xmlHttpRequest({ 
					url : `https://api.jikan.moe/v4/users/${userName}/favorites`,
				}).catch(e => console.error(e));
				if (response3.status == 200) {
					const favorites = JSON.parse(response3.responseText);
					favorites.data.anime.forEach(ani => {
						data.data.MediaListCollection.user.favourites.fav.nodes.push({ id: ani.mal_id})
					});

				}
			}
			else {
				data = await anilistAPI(listQuery, {
					variables: {name:userName,listType:type.toUpperCase()}
				})
			}

			if(data.errors){
				return
			}
			listCache[userName] = data;
			handleData(data,false)
		}
		return
	};
	let deleteUser = function(index){
		users.splice(index,1);
		shows.forEach(function(show){
			show.score.splice(index,1);
			show.scorePersonal.splice(index,1);
			show.status.splice(index,1);
			show.progress.splice(index,1);
			show.favourite.splice(index,1)
		});
		shows = shows.filter(function(show){
			return !show.status.every(status => status === "NOT")
		});
		if(guser === index){
			guser = false
		}
		else if(guser > index){
			guser--
		}
		sortShows();
		drawUsers();
		drawTable();
		changeUserURL()
	};
	formatFilter.oninput = function(){drawTable();changeUserURL()};
	ratingFilter.oninput = function(){drawTable();changeUserURL()};
	systemFilter.onclick = function(){
		useScripts.comparisionSystemFilter = systemFilter.checked;
		useScripts.save();
		if(systemFilter.checked){
			normalFilter.checked = false;
			sortShows()
		}
		drawTable();changeUserURL()
	};
	normalFilter.onclick = function(){
		if(normalFilter.checked){
			systemFilter.checked = false;
			useScripts.comparisionSystemFilter = false;
			useScripts.save();
		}
		sortShows();drawTable();changeUserURL()
	}
	colourFilter.onclick = function(){
		useScripts.comparisionColourFilter = colourFilter.checked;
		useScripts.save();
		drawTable();changeUserURL()
	};
	sequelFilter.onclick = function(){
		drawTable()
	};
	let searchParams = new URLSearchParams(location.search);
	let paramFormat = searchParams.get("filter");
	if(paramFormat){
		formatFilter.value = paramFormat
	}
	let paramRating = searchParams.get("minRatings");
	if(paramRating){
		ratingFilter.value = paramRating
	}
	let paramSystem = searchParams.get("ratingSystems");
	if(paramSystem){
		systemFilter.checked = (paramSystem === "true")
	}
	let normalSystem = searchParams.get("normalizeRatings");
	if(normalSystem){
		normalFilter.checked = (normalSystem === "true")
	}
	let paramColour = searchParams.get("fullColour");
	if(paramColour){
		colourFilter.checked = (paramColour === "true")
	}
	let paramSort = searchParams.get("sort");
	if(paramSort){
		digestValue = paramSort;
		ratingMode = paramSort
	}
	let paramUsers = searchParams.get("users");
	if(paramUsers){
		paramUsers.split(",").forEach(user => {
			let paramDemand = user.match(/(\*|-)$/);
			if(paramDemand){
				paramDemand = paramDemand[0]
			}
			user = user.replace(/(\*|-)$/,"");
			if(user === "~"){
				addUser(whoAmI,paramDemand)
			}
			else{
				addUser(user,paramDemand)
			}
		})
	}
	else{
		addUser(whoAmI);
		addUser(userA)
	}
}
//end modules/addComparisionPage.js
//begin modules/addCompletedScores.js
function addCompletedScores(){
	//also for dropped, if in the settings
	if(! /^\/(home|user|activity)\/?([\w-]+)?\/?$/.test(location.pathname)){
		return
	}
	setTimeout(addCompletedScores,1000);
	let bigQuery = [];
	let statusCollection = document.querySelectorAll(".status");
	statusCollection.forEach(function(status){
		if(
			(useScripts.completedScore
				&& (
					/^completed/i.test(status.innerText)
					|| status.childNodes[0].textContent.trim() === "Rewatched"
					|| status.childNodes[0].textContent.trim() === "Reread"
					|| status.classList.contains("activityCompleted")
					|| status.classList.contains("activityRewatched")
					|| status.classList.contains("activityReread")
				)
			)
			|| (useScripts.droppedScore && (/^dropped/i.test(status.innerText) || status.classList.contains("activityDropped")))
			|| /^\/activity/.test(location.pathname)
		){
			if(!hasOwn(status, "hohScoreMatched")){
				status.hohScoreMatched = true;
				let scoreInfo = create("span","hohFeedScore",false,status);
				const mediaId = /\/(\d+)\//.exec(status.children[0].href);
				if(!mediaId || !mediaId.length){
					return
				}
				scoreInfo.style.display = "none";
				let callback = function(data){
					if(!data){
						return
					}
					data = data.data.MediaList;
					let scoreSuffix = scoreFormatter(
						data.score,
						data.user.mediaListOptions.scoreFormat
					);
					let noteContent = parseListJSON(data.notes);
					let noteSuffix = "";
					if(noteContent){
						if(hasOwn(noteContent, "message")){
							noteSuffix += " " + noteContent.message
						}
					}
					let rewatchSuffix = "";
					if(data.repeat > 0){
						if(data.media.type === "ANIME"){
							if(data.repeat === 1){
								rewatchSuffix = " " + translate("$rewatch_suffix_1")
							}
							else{
								rewatchSuffix = " " + translate("$rewatch_suffix_M",data.repeat)
							}
						}
						else{
							if(data.repeat === 1){
								rewatchSuffix = " " + translate("$reread_suffix_1")
							}
							else{
								rewatchSuffix = " " + translate("$reread_suffix_M",data.repeat)
							}
						}
					}
					if(data.score){
						//depends on the parameters score and scoreFormat, which are defined as a float and an enum in the Anilist API docs
						if(
							/^completed/i.test(status.innerText)
							|| status.classList.contains("activityCompleted")
							|| status.classList.contains("activityRewatched")
							|| status.classList.contains("activityReread")
						){
							scoreInfo.appendChild(scoreSuffix);
							create("span","hohNoteSuffix",noteSuffix,scoreInfo);
							create("span","hohRewatchSuffix",rewatchSuffix,scoreInfo)
						}
						else{
							scoreInfo.appendChild(scoreSuffix);
							create("span","hohNoteSuffix",noteSuffix,scoreInfo)
						}
						scoreInfo.style.display = "inline"
					}
				};
				const variables = {
					userName: status.parentNode.children[0].innerText.trim(),
					mediaId: +mediaId[1]
				};
				const query = `
query($userName: String,$mediaId: Int){
	MediaList(
		userName: $userName,
		mediaId: $mediaId
	){
		score
		mediaId
		notes
		repeat
		media{type}
		user{
			name
			mediaListOptions{scoreFormat}
		}
	}
}`;
				//generalAPIcall(query,variables,callback,"hohCompletedScores" + variables.mediaId + variables.userName,60*1000)
				bigQuery.push({
					query: query,
					variables: variables,
					callback: callback,
					cacheKey: "hohCompletedScores" + variables.mediaId + variables.userName,
					duration: 60*1000
				})
			}
		}
		else if(status.children.length === 2 && !status.classList.contains("form")){
			status.children[1].remove()
		}
	});
	queryPacker(bigQuery)
}
//end modules/addCompletedScores.js
//begin modules/addCustomCSS.js
function addCustomCSS(){
	if(useScripts.SFWmode || script_type === "Boneless"){
		return
	}
	let URLstuff = location.pathname.match(/^\/user\/([^/]*)\/?/);
	if(!customStyle.textContent || (decodeURIComponent(URLstuff[1]) !== currentUserCSS)){
		const query = `
		query($userName: String) {
			User(name: $userName){
				about
			}
		}`;
		let variables = {
			userName: decodeURIComponent(URLstuff[1])
		}
		let css_handler = function(data){
			customStyle.textContent = "";
			let external = document.getElementById("customExternalCSS");
			if(external){
				external.remove()
			}
			if(!data){
				return
			}
			if(!(/anilist\.co\/user\//.test(document.URL))){
				return
			}
			let jsonMatch = (data.data.User.about || "").match(/^\[\]\(json([A-Za-z0-9+/=]+)\)/);
			if(!jsonMatch){
				return
			}
			try{
				let jsonData;
				try{
					jsonData = JSON.parse(atob(jsonMatch[1]))
				}
				catch(e){
					jsonData = JSON.parse(LZString.decompressFromBase64(jsonMatch[1]))
				}
				if(jsonData.customCSS){
					if(jsonData.customCSS.match(/^https.*\.css$/)){
						let styleRef = document.createElement("link");
						styleRef.id = "customExternalCSS";
						styleRef.rel = "stylesheet";
						styleRef.type = "text/css";
						styleRef.href = jsonData.customCSS;
						document.getElementsByTagName("head")[0].appendChild(styleRef)
					}
					else{
						customStyle.textContent = jsonData.customCSS
					}
					currentUserCSS = decodeURIComponent(URLstuff[1])
				}
				if(jsonData.pinned){
					try{
						generalAPIcall(
`
query{
	Activity(id: ${jsonData.pinned}){
		... on ListActivity{
			type
			id
			user{id name avatar{medium}}
			replyCount
			likes{name}
			status
			progress
			media{
				type
				title{native romaji english}
				id
				coverImage{large}
			}
			createdAt
		}
		... on MessageActivity{
			type
			id
			text:message(asHtml: false)
			user:messenger{id name avatar{medium}}
			replyCount
			likes{name}
			createdAt
		}
		... on TextActivity{
			type
			id
			text(asHtml: false)
			user{id name avatar{medium}}
			replyCount
			likes{name}
			createdAt
		}
	}
}
`,
							{},
							function(data){
								if(!data){
									return
								}
								let adder = function(){
									let URLstuff2 = location.pathname.match(/^\/user\/([^/]*)\/?/);
									if(!URLstuff2 || decodeURIComponent(URLstuff2[1]) !== decodeURIComponent(URLstuff[1])){
										return
									}
									let feed = document.querySelector(".activity-feed-wrap");
									if(feed){
										let entry = create("div",["activity-entry","hohPinned"]);
										feed.insertBefore(entry,feed.children[0]);
										let act = data.data.Activity;
										if(act.type === "TEXT"){
											entry.classList.add("activity-text")
										}
										else if(act.type === "MESSAGE"){
											entry.classList.add("activity-message")
										}
										else if(act.type === "ANIME_LIST"){
											entry.classList.add("activity-anime_list")
										}
										else if(act.type === "MANGA_LIST"){
											entry.classList.add("activity-manga_list")
										}
let wrap = create("div","wrap",false,entry);
	let content = create("div",false,false,wrap);
		if(act.type === "TEXT" || act.type === "MESSAGE"){
			content.classList.add("text");
			let header = create("div","header",false,content);
				let avatar = create("a",["avatar","router-link-exact-active","router-link-active"],false,header);
				avatar.href = "/user/" + act.user.name + "/";
				avatar.style.backgroundImage = 'url("' + act.user.avatar.medium + '")';
				let avatarName = create("a",["name","router-link-exact-active","router-link-active"],act.user.name,header);
				avatarName.href = "/user/" + act.user.name + "/";
			let markdownWrapper = create("div","activity-markdown",false,content);
				let markdown = create("div","markdown",false,markdownWrapper);
				markdown.innerHTML = DOMPurify.sanitize(makeHtml(act.text))
		}
		else if(act.type === "ANIME_LIST" || act.type === "MANGA_LIST"){
			content.classList.add("list");
			let cover = create("a","cover",false,content);
			const linkURL = "/" + (act.type === "ANIME_LIST" ? "anime" : "manga") + "/" + act.media.id + "/" + safeURL(titlePicker(act.media)) + "/";
			cover.href = linkURL;
			cover.style.backgroundImage = 'url("' + act.media.coverImage.large + '")';
			let details = create("div","details",false,content);
				if(act.user.name !== decodeURIComponent(URLstuff[1])){
					let name = create("a",["name","router-link-exact-active","router-link-active"],act.user.name,details);
					name.href = "/user/" + act.user.name + "/"
				}
				let status = create("div","status",act.status + (act.progress ? " " + act.progress + " of " : " "),details);
				let title = create("a","title",titlePicker(act.media),status);
				title.href = linkURL
		}
	let time = create("div","time",false,wrap);
		let postLink = create("a","icon",false,time,"margin-right: 10px;");
			postLink.appendChild(svgAssets2.link.cloneNode(true));
			postLink.href = "/activity/" + act.id + "/";
			cheapReload(postLink,{name: "Activity", params: {id: act.id}});
		let pinnedLabel = create("div","pinned",false,time,"display: inline-block;padding-right: 5px;color: rgba(var(--color-blue),.9);");
			pinnedLabel.appendChild(svgAssets2.pinned.cloneNode(true));
			pinnedLabel.appendChild(document.createTextNode(" " + translate("$pinned")));
		time.appendChild(nativeTimeElement(act.createdAt));
	let actions = create("div","actions",false,wrap);
		let actionReplies = create("a",["action","replies"],false,actions);
			let replyCount = create("span",["count"],act.replyCount || "",actionReplies);
			replyCount.appendChild(document.createTextNode(" "));
			actionReplies.appendChild(svgAssets2.reply.cloneNode(true));
			actionReplies.href = "/activity/" + act.id + "/";
			cheapReload(actionReplies,{name: "Activity", params: {id: act.id}});
		actions.appendChild(document.createTextNode(" "));
		let actionLikes = create("div",["action","likes","hohHandledLike","hohLoadedLikes"],false,actions);
			actionLikes.title = act.likes.map(like => like.name).join("\n");
			let likeWrap = create("div",["like-wrap","activity"],false,actionLikes);
				let likeButton = create("div","button",false,likeWrap);
					let likeCount = create("span","count",act.likes.length || "",likeButton);
					likeButton.appendChild(document.createTextNode(" "));
					likeButton.appendChild(svgAssets2.likeNative.cloneNode(true));
					if(act.likes.findIndex(thing => thing.name === whoAmI) !== -1){
						likeButton.classList.add("liked")
					}
					if(useScripts.accessToken){
						likeButton.onclick = function(){
							let indexPlace = act.likes.findIndex(thing => thing.name === whoAmI);
							if(indexPlace === -1){
								act.likes.push({name: whoAmI});
								likeButton.classList.add("liked")
							}
							else{
								act.likes.splice(indexPlace,1);
								likeButton.classList.remove("liked")
							}
							likeCount.innerText = act.likes.length || "";
							authAPIcall(
								"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY){id}}",
								{id: act.id},
								function(data){
									if(!data){
										authAPIcall(//try again once if it fails
											"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY){id}}",
											{id: act.id},
											data => {}
										)
									}
								}
							);
							deleteCacheItem("hohPinned" + jsonData.pinned)
						}
					}
									}
									else{
										setTimeout(adder,500)
									}
								};
								adder()
							},"hohPinned" + jsonData.pinned,60*1000
						)
					}
					catch(e){
						console.warn("pinned activity error",jsonData.pinned,e)
					}
				}
				else{
					let carriedOver = document.querySelector(".hohPinned");
					if(carriedOver){
						carriedOver.remove()
					}
				}
			}
			catch(e){
				console.warn("Invalid profile JSON for " + variables.userName + ". Aborting.");
				console.log(e);
				console.log(atob(jsonMatch[1]));
			}
		};
		if(variables.userName === whoAmI){
			authAPIcall(query,variables,css_handler,"hohProfileBackground" + variables.userName,5*60*1000)
		}
		else{
			generalAPIcall(query,variables,css_handler,"hohProfileBackground" + variables.userName,5*60*1000)
		}
	}
}
//end modules/addCustomCSS.js
//begin modules/addDblclickZoom.js
exportModule({
	id: "dblclickZoom",
	description: "$dblclickZoom_description",
	extendedDescription: "$dblclickZoom_extendedDescription",
	isDefault: false,
	importance: -1,
	categories: ["Feeds"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return location.pathname.match(/^\/home\/?$/)
	},
	code: function(){
		function addDblclickZoom(){
			if(!location.pathname.match(/^\/home\/?$/)){
				return
			}
			let activityFeedWrap = document.querySelector(".activity-feed-wrap");
			if(!activityFeedWrap){
				setTimeout(addDblclickZoom,200);
				return
			}
			activityFeedWrap.addEventListener("dblclick",function(e){
				e = e || window.event;
				let target = e.target || e.srcElement;
				while(target.classList){
					if(target.classList.contains("activity-entry")){
						target.classList.toggle("hohZoom");
						break
					}
					target = target.parentNode
				}  
			},false)
		}
	},
	css: `
.hohZoom{
	transform: scale(1.5);
	transform-origin: 0 0;
	transition: transform 0.4s;
	z-index: 200;
	box-shadow: 5px 5px 5px black;
}
.hohZoom .reply-wrap{
	background: rgb(var(--color-background));
}`
})
//end modules/addDblclickZoom.js
//begin modules/addEntryScore.js
function addEntryScore(id,tries){
	if(!location.pathname.match(/^\/(anime|manga)/)){
		return
	}
	let existing = document.getElementById("hohEntryScore");
	if(existing){
		if(existing.dataset.mediaId === id && !tries){
			return
		}
		else{
			existing.remove()
		}
	}
	let possibleLocation = document.querySelector(".actions .list .add");
	if(possibleLocation){
		let miniHolder = create("div","#hohEntryScore",false,possibleLocation.parentNode.parentNode,"position:relative;");
		miniHolder.dataset.mediaId = id;
		let type = possibleLocation.innerText;
		if(type !== "Add to List" && type !== translate("$mediaStatus_not")){
			let updateSubInfo = function(override){
				generalAPIcall(
					"query($id:Int,$name:String){MediaList(mediaId:$id,userName:$name){score progress media{episodes chapters}}}",
					{id: id,name: whoAmI},
					function(data){
						removeChildren(miniHolder);
						let MediaList = data.data.MediaList;
						let scoreSpanContainer = create("div","hohMediaScore",false,miniHolder);
						let scoreSpan = create("span",false,false,scoreSpanContainer);
						scoreSpan.title = "Score";
						let minScore = 1;
						let maxScore = 100;
						let stepSize = 1;
						if(["POINT_10","POINT_10_DECIMAL"].includes(userObject.mediaListOptions.scoreFormat)){
							maxScore = 10
						}
						if(userObject.mediaListOptions.scoreFormat === "POINT_10_DECIMAL"){
							minScore = 0.1;
							stepSize = 0.1
						}
						if(userObject.mediaListOptions.scoreFormat === "POINT_5"){
							maxScore = 5
						}
						if(MediaList.score){
							scoreSpan.appendChild(scoreFormatter(MediaList.score,userObject.mediaListOptions.scoreFormat));
							if(useScripts.accessToken && ["POINT_100","POINT_10","POINT_10_DECIMAL","POINT_5"].includes(userObject.mediaListOptions.scoreFormat)){
								let updateScore = function(isUp){
									let score = MediaList.score;
									if(isUp){
										MediaList.score += stepSize
									}
									else{
										MediaList.score -= stepSize
									}
									if(MediaList.score >= minScore && MediaList.score <= maxScore){
										scoreSpan.lastChild.remove();
										scoreSpan.appendChild(scoreFormatter(MediaList.score,userObject.mediaListOptions.scoreFormat));
										authAPIcall(
											`mutation($id:Int,$score:Float){
												SaveMediaListEntry(mediaId:$id,score:$score){
													score
												}
											}`,
											{id: id,score: MediaList.score},
											data => {
												if(!data){
													if(isUp){
														MediaList.score -= stepSize
													}
													else{
														MediaList.score += stepSize
													}
													scoreSpanContainer.style.color = "rgb(var(--color-red))";
													scoreSpanContainer.title = "Updating score failed"
												}
											}
										);
										let blockingCache = JSON.parse(sessionStorage.getItem("hohEntryScore" + id + whoAmI));
										blockingCache.data.data.MediaList.score = MediaList.score.roundPlaces(1);
										blockingCache.time = NOW();
										sessionStorage.setItem("hohEntryScore" + id + whoAmI,JSON.stringify(blockingCache));
									}
									else if(MediaList.score < minScore){
										MediaList.score = minScore
									}
									else if(MediaList.score > maxScore){
										MediaList.score = maxScore
									}
								};
								let changeMinus = create("span","hohChangeScore","-",false,"padding:2px;position:absolute;left:-1px;top:-2.5px;");
								scoreSpanContainer.insertBefore(changeMinus,scoreSpanContainer.firstChild);
								let changePluss = create("span","hohChangeScore","+",scoreSpanContainer,"padding:2px;");
								changeMinus.onclick = function(){updateScore(false)};
								changePluss.onclick = function(){updateScore(true)};
							}
						}
						if(type !== "Completed" && type !== translate("$mediaStatus_completed")){
							let progressPlace = create("span","hohMediaScore",false,miniHolder,"right:0px;");
							progressPlace.title = "Progress";
							let progressVal = create("span",false,MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : ""),progressPlace);
							if(useScripts.accessToken){
								let changePluss = create("span","hohChangeScore","+",progressPlace,"padding:2px;position:absolute;top:-2.5px;");
								changePluss.onclick = function(){
									MediaList.progress++;
									authAPIcall(
										`mutation($id:Int,$progress:Int){
											SaveMediaListEntry(mediaId:$id,progress:$progress){
												progress
											}
										}`,
										{id: id,progress: MediaList.progress},
										data => {
											if(!data){
												MediaList.progress--;
												progressVal.innerText = MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : "");
												progressVal.style.color = "rgb(var(--color-red))";
												progressVal.title = "Updating progress failed"
											}
										}
									);
									progressVal.innerText = MediaList.progress + (MediaList.media.episodes ? "/" + MediaList.media.episodes : MediaList.media.chapters ? "/" + MediaList.media.chapters : "");
									let hohGuesses = Array.from(document.querySelectorAll(".hohGuess"));
									if(hohGuesses.length === 2){
										let oldProgress = parseInt(hohGuesses[0].innerText.match(/\d+/));
										if(MediaList.progress >= oldProgress){
											hohGuesses[1].remove()
										}
										else{
											hohGuesses[1].innerText = "[+" + (MediaList.progress - oldProgress) + "]"
										}
									}
								}
							}
						}
					},
					"hohEntryScore" + id + whoAmI,30*1000,undefined,override
				)
			};
			updateSubInfo();
			let editorOpen = false;
			//try to detect if the user has recently edited the media. If so, update the info to match
			let editorChecker = function(){
				if(document.querySelector(".list-editor-wrap")){
					editorOpen = true
				}
				else if(editorOpen){
					editorOpen = false;
					updateSubInfo(true)
				}
				setTimeout(function(){
					if(!location.pathname.match(/^\/(anime|manga)/)){
						return
					}
					editorChecker()
				},1000)
			};
			editorChecker()
		}
		else if(type === "Add to List" && (tries || 0) < 10){
			setTimeout(function(){addEntryScore(id,(tries || 0) + 1)},200);
		}
	}
	else{
		setTimeout(function(){addEntryScore(id)},200)
	}
}
//end modules/addEntryScore.js
//begin modules/addFeedFilters.js
function addFeedFilters(){
	if(!location.pathname.match(/^\/home\/?$/)){
		return
	}
	let filterBox = document.querySelector(".hohFeedFilter");
	if(filterBox){
		return
	}
	let activityFeedWrap = document.querySelector(".activity-feed-wrap");
	if(!activityFeedWrap){
		setTimeout(addFeedFilters,100);
		return
	}
	let activityFeed = activityFeedWrap.querySelector(".activity-feed");
	if(!activityFeed){
		setTimeout(addFeedFilters,100);
		return
	}
	let commentFilterBoxInput;
	let commentFilterBoxLabel;
	let likeFilterBoxInput;
	let likeFilterBoxLabel;
	let allFilterBox;
	let blockList = localStorage.getItem("blockList");
	if(blockList){
		blockList = JSON.parse(blockList)
	}
	else{
		blockList = []
	}
	let postRemover = function(){
		if(!location.pathname.match(/^\/home\/?$/)){
			return
		}
		for(var i=0;i<activityFeed.children.length;i++){
			if(activityFeed.children[i].querySelector(".el-dialog__wrapper")){
				continue
			}
			let actionLikes = activityFeed.children[i].querySelector(".action.likes .button .count");
			if(actionLikes){
				actionLikes = parseInt(actionLikes.innerText)
			}
			else{
				actionLikes = 0
			}
			let actionReplies = activityFeed.children[i].querySelector(".action.replies .count");
			if(actionReplies){
				actionReplies = parseInt(actionReplies.innerText)
			}
			else{
				actionReplies = 0
			}
			let blockRequire = true;
			if(useScripts.blockWord && activityFeed.children[i].classList.contains("activity-text")){
				try{
					if(activityFeed.children[i].innerText.match(new RegExp(blockWordValue,"i"))){
						blockRequire = false
					}
				}
				catch(err){
					if(activityFeed.children[i].innerText.toLowerCase().match(useScripts.blockWordValue.toLowerCase())){
						blockRequire = false
					}
				}
			}
			if(useScripts.statusBorder){
				let blockerMap = {
					"plans": "PLANNING",
					"watched": "CURRENT",
					"read": "CURRENT",
					"completed": "COMPLETED",
					"paused": "PAUSED",
					"dropped": "DROPPED",
					"rewatched": "REPEATING",
					"reread": "REPEATING"
				};
				let blockerClassMap = {
					"activityPlanning": "PLANNING",
					"activityWatching": "CURRENT",
					"activityReading": "CURRENT",
					"activityCompleted": "COMPLETED",
					"activityPaused": "PAUSED",
					"activityDropped": "DROPPED",
					"activityRewatching": "REPEATING",
					"activityRewatched": "REPEATING",
					"activityRereading": "REPEATING",
					"activityReread": "REPEATING"
				};
				if(activityFeed.children[i].classList.contains("activity-anime_list") || activityFeed.children[i].classList.contains("activity-manga_list")){
					let status = blockerClassMap[
							activityFeed.children[i].querySelector(".status").classList[1]
						] || blockerMap[
						Object.keys(blockerMap).find(
							key => activityFeed.children[i].querySelector(".status").innerText.toLowerCase().includes(key)
						)
					]
					if(status === "CURRENT"){
						activityFeed.children[i].children[0].style.borderRightWidth = "0px";
						activityFeed.children[i].children[0].style.marginRight = "0px"
					}
					else if(status === "COMPLETED"){
						activityFeed.children[i].children[0].style.borderRightStyle = "solid";
						activityFeed.children[i].children[0].style.borderRightWidth = "5px";
						if(useScripts.CSSgreenManga && activityFeed.children[i].classList.contains("activity-anime_list")){
							activityFeed.children[i].children[0].style.borderRightColor = "rgb(var(--color-blue))"
						}
						else{
							activityFeed.children[i].children[0].style.borderRightColor = "rgb(var(--color-green))"
						}
						activityFeed.children[i].children[0].style.marginRight = "-5px"
					}
					else{
						activityFeed.children[i].children[0].style.borderRightStyle = "solid";
						activityFeed.children[i].children[0].style.borderRightWidth = "5px";
						activityFeed.children[i].children[0].style.marginRight = "-5px";
						activityFeed.children[i].children[0].style.borderRightColor = distributionColours[status];
					}
				}	
			}
			const statusCheck = {
				"planning": /^plans/i,
				"watching": /^watched/i,
				"reading": /^read/i,
				"completing": /^completed/i,
				"pausing": /^paused/i,
				"dropping": /^dropped/i,
				"rewatching": /^rewatched/i,
				"rereading": /^reread/i
			}
			if(
				(!useScripts.feedCommentFilter || (
					actionLikes >= likeFilterBoxInput.value
					&& (likeFilterBoxInput.value >= 0 || actionLikes < -likeFilterBoxInput.value)
					&& actionReplies >= commentFilterBoxInput.value
					&& (commentFilterBoxInput.value >= 0 || actionReplies < -commentFilterBoxInput.value)
				))
				&& blockRequire
				&& blockList.every(
					blocker => (
						blocker.user
						&& activityFeed.children[i].querySelector(".name").textContent.trim().toLowerCase() !== blocker.user.toLowerCase()
					)
					|| (
						blocker.media
						&& (
							activityFeed.children[i].classList.contains("activity-text")
							|| activityFeed.children[i].querySelector(".status .title").href.match(/\/(anime|manga)\/(\d+)/)[2] !== blocker.media
						)
					)
					|| (
						blocker.status
						&& (
							activityFeed.children[i].classList.contains("activity-text")
							|| blocker.status == "status"
							|| (
								blocker.status === "anime"
								&& !activityFeed.children[i].classList.contains("activity-anime_list")
							)
							|| (
								blocker.status === "manga"
								&& !activityFeed.children[i].classList.contains("activity-manga_list")
							)
							|| (
								statusCheck[blocker.status]
								&& !activityFeed.children[i].querySelector(".status").textContent.trim().match(statusCheck[blocker.status])
							)
						)
					)
				)
			){
				if(
					useScripts.SFWmode
					&& activityFeed.children[i].classList.contains("activity-text")
					&& badWords.some(word => activityFeed.children[i].querySelector(".activity-markdown").innerText.match(word))
				){
					activityFeed.children[i].style.opacity= 0.5
				}
				else{
					activityFeed.children[i].style.display = ""
				}
			}
			else{
				activityFeed.children[i].style.display = "none"
			}
		}
	};
	let postTranslator = function(){
		Array.from(activityFeed.children).forEach(activity => {
			try{
				let timeElement = activity.querySelector(".time time");
				if(timeElement && !timeElement.classList.contains("hohTimeGeneric")){
					let seconds = new Date(timeElement.dateTime).valueOf()/1000;
					let replacement = nativeTimeElement(seconds);
					timeElement.style.display = "none";
					replacement.style.position = "relative";
					replacement.style.right = "unset";
					replacement.style.top = "unset";
					timeElement.parentNode.insertBefore(replacement, timeElement)
				}
			}
			catch(e){
				console.warn("time element translation is broken")
			}
			let statusParent = activity.querySelector(".status");
			if(!statusParent){
				return
			}
			let status = statusParent.childNodes[0];
			let cont = status.textContent.trim().match(/(.+?)(\s(\d+|\d+ - \d+) of)?$/);
			if(cont){
				let prog = cont[3];
				let type = cont[1];
				if(activity.classList.contains("activity-anime_list")){
					if(type === "Completed"){
						status.textContent = translate("$listActivity_completedAnime");
						statusParent.classList.add("activityCompleted")
					}
					else if(type === "Watched episode" && prog){
						status.textContent = translate("$listActivity_MwatchedEpisode",prog);
						statusParent.classList.add("activityWatching")
					}
					else if(type === "Dropped" && prog){
						status.textContent = translate("$listActivity_MdroppedAnime",prog);
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Dropped"){
						status.textContent = translate("$listActivity_droppedAnime");
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Rewatched episode" && prog){
						status.textContent = translate("$listActivity_MrepeatingAnime",prog);
						statusParent.classList.add("activityRewatching")
					}
					else if(type === "Rewatched"){
						status.textContent = translate("$listActivity_repeatedAnime");
						statusParent.classList.add("activityRewatched")
					}
					else if(type === "Paused watching"){
						status.textContent = translate("$listActivity_pausedAnime");
						statusParent.classList.add("activityPaused")
					}
					else if(type === "Plans to watch"){
						status.textContent = translate("$listActivity_planningAnime");
						statusParent.classList.add("activityPlanning")
					}
				}
				else if(activity.classList.contains("activity-manga_list")){
					if(type === "Completed"){
						status.textContent = translate("$listActivity_completedManga");
						statusParent.classList.add("activityCompleted")
					}
					else if(type === "Read chapter" && prog){
						status.textContent = translate("$listActivity_MreadChapter",prog);
						statusParent.classList.add("activityReading")
					}
					else if(type === "Dropped" && prog){
						status.textContent = translate("$listActivity_MdroppedManga",prog);
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Dropped"){
						status.textContent = translate("$listActivity_droppedManga");
						statusParent.classList.add("activityDropped")
					}
					else if(type === "Reread chapter" && prog){
						status.textContent = translate("$listActivity_MrepeatingManga",prog);
						statusParent.classList.add("activityRereading")
					}
					else if(type === "Reread"){
						status.textContent = translate("$listActivity_repeatedManga");
						statusParent.classList.add("activityReread")
					}
					else if(type === "Paused reading"){
						status.textContent = translate("$listActivity_pausedManga");
						statusParent.classList.add("activityPaused")
					}
					else if(type === "Plans to read"){
						status.textContent = translate("$listActivity_planningManga");
						statusParent.classList.add("activityPlanning")
					}
				}
				if(useScripts.partialLocalisationLanguage === "日本語"){
					statusParent.classList.add("hohReverseTitle")
				}
			}
		})
	}
	if(useScripts.feedCommentFilter){
		filterBox = create("div","hohFeedFilter",false,activityFeedWrap);
		create("span","hohDescription","At least ",filterBox);
		activityFeedWrap.style.position = "relative";
		activityFeedWrap.children[0].childNodes[0].nodeValue = "";
		commentFilterBoxInput = create("input",false,false,filterBox);
		commentFilterBoxInput.type = "number";
		commentFilterBoxInput.value = useScripts.feedCommentComments;
		commentFilterBoxLabel = create("span",false," comments, ",filterBox);
		likeFilterBoxInput = create("input",false,false,filterBox);
		likeFilterBoxInput.type = "number";
		likeFilterBoxInput.value = useScripts.feedCommentLikes;
		likeFilterBoxLabel = create("span",false," likes",filterBox);
		allFilterBox = create("button",false,"⟳",filterBox,"padding:0px;");
		commentFilterBoxInput.onchange = function(){
			useScripts.feedCommentComments = commentFilterBoxInput.value;
			useScripts.save();
			postRemover();
		};
		likeFilterBoxInput.onchange = function(){
			useScripts.feedCommentLikes = likeFilterBoxInput.value;
			useScripts.save();
			postRemover();
		};
		allFilterBox.onclick = function(){
			commentFilterBoxInput.value = 0;
			likeFilterBoxInput.value = 0;
			useScripts.feedCommentComments = 0;
			useScripts.feedCommentLikes = 0;
			useScripts.save();
			postRemover();
		};
	}
	let mutationConfig = {
		attributes: false,
		childList: true,
		subtree: false
	};
	let observer = new MutationObserver(function(){
		postRemover();
		if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
			postTranslator()
		}
		setTimeout(postRemover,500);
	});
	observer.observe(activityFeed,mutationConfig);
	let observerObserver = new MutationObserver(function(){//Who police police? The police police police police
		activityFeed = activityFeedWrap.querySelector(".activity-feed");
		if(activityFeed){
			observer.disconnect();
			observer = new MutationObserver(function(){
				postRemover();
				if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
					postTranslator()
				}
				setTimeout(postRemover,500);
			});
			observer.observe(activityFeed,mutationConfig);
		}
	});
	observerObserver.observe(activityFeedWrap,mutationConfig);
	postRemover();
	if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
		postTranslator()
	}
	let waiter = function(){
		setTimeout(function(){
			if(location.pathname.match(/^\/home\/?$/)){
				postRemover();
				waiter();
			}
		},5*1000);
	};waiter();
}
//end modules/addFeedFilters.js
//begin modules/addFeedFilters_user.js
function addFeedFilters_user(){
	if(!/^https:\/\/anilist\.co\/user/.test(document.URL)){
		return
	}
	let activityFeed = document.querySelector(".activity-feed");
	if(!activityFeed){
		setTimeout(addFeedFilters_user,100);
		return
	}
	if(activityFeed.classList.contains("hohTranslated")){
		return
	}
	activityFeed.classList.add("hohTranslated");
	let postTranslator = function(){
		Array.from(activityFeed.children).forEach(activity => {
			try{
				let timeElement = activity.querySelector(".time time");
				if(timeElement && !timeElement.classList.contains("hohTimeGeneric")){
					let seconds = new Date(timeElement.dateTime).valueOf()/1000;
					let replacement = nativeTimeElement(seconds);
					timeElement.style.display = "none";
					replacement.style.position = "relative";
					replacement.style.right = "unset";
					replacement.style.top = "unset";
					timeElement.parentNode.insertBefore(replacement, timeElement)
				}
			}
			catch(e){
				console.warn("time element translation is broken")
			}
		})
	}
	let mutationConfig = {
		attributes: false,
		childList: true,
		subtree: false
	};
	let observer = new MutationObserver(function(){
		if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
			postTranslator()
		}
	});
	observer.observe(activityFeed,mutationConfig);
	let observerObserver = new MutationObserver(function(){
		activityFeed = document.querySelector(".activity-feed");
		if(activityFeed){
			observer.disconnect();
			observer = new MutationObserver(function(){
				postRemover();
				if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
					postTranslator()
				}
			});
			observer.observe(activityFeed,mutationConfig);
		}
	});
	observerObserver.observe(activityFeed,mutationConfig);
	if(useScripts.additionalTranslation && useScripts.partialLocalisationLanguage !== "English"){
		postTranslator()
	}
}
//end modules/addFeedFilters_user.js
//begin modules/addFollowCount.js
async function addFollowCount(){
	let URLstuff = location.pathname.match(/^\/user\/(.*)\/social/)
	if(!URLstuff){
		return
	}
	const userData = await anilistAPI("query($name:String){User(name:$name){id}}", {
		variables: {name: decodeURIComponent(URLstuff[1])},
		cacheKey: "hohIDlookup" + decodeURIComponent(URLstuff[1]).toLowerCase(),
		duration: 5*60*1000
	});
	if(userData.errors){
		return
	}
	//these two must be separate calls, because they are allowed to fail individually (too many followers)
	const followerData = await anilistAPI("query($id:Int!){Page(perPage:1){pageInfo{total} followers(userId:$id){id}}}", {
		variables: {id:userData.data.User.id}
	});
	const followingData = await anilistAPI("query($id:Int!){Page(perPage:1){pageInfo{total} following(userId:$id){id}}}", {
		variables: {id:userData.data.User.id}
	});
	const insertCount = function(data, id, pos){
		const target = document.querySelector(".filter-group");
		if(target){
			target.style.position = "relative";
			let followCount = "65536+";
			if(!data.errors){
				followCount = data.data.Page.pageInfo.total
			}
			create("span",[id,"hohCount"],followCount,target.children[pos]);
		}
	}
	insertCount(followerData, "#hohFollowersCount", 2)
	insertCount(followingData, "#hohFollowingCount", 1)
	return
}
//end modules/addFollowCount.js
//begin modules/addForumMedia.js
exportModule({
	id: "addForumMedia",
	description: "$forumMedia_backlink",
	isDefault: true,
	importance: -1,
	categories: ["Forum","Navigation"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url.includes("https://anilist.co/forum/recent?media=")
	},
	code: async function(){
		let id = parseInt(document.URL.match(/\d+$/)[0]);
		let adder = function(data){
			if(!document.URL.includes(id) || !data){
				return
			}
			let feed = document.querySelector(".feed");
			if(!feed){
				setTimeout(function(){adder(data)},200);
				return
			}
			data.data.Media.id = id;
			let mediaLink = create("a",false,titlePicker(data.data.Media),false,"padding:10px;display:block;");
			mediaLink.href = data.data.Media.siteUrl;
			cheapReload(mediaLink,{path: mediaLink.pathname})
			if(data.data.Media.siteUrl.includes("manga") && useScripts.CSSgreenManga){
				mediaLink.style.color = "rgb(var(--color-green))"
			}
			else{
				mediaLink.style.color = "rgb(var(--color-blue))"
			}
			feed.insertBefore(mediaLink,feed.firstChild);
		}
		const data = await anilistAPI("query($id:Int){Media(id:$id){title{native english romaji} siteUrl}}", {
			variables: {id},
			cacheKey: "hohMediaLookup" + id,
			duration: 30*60*1000
		})
		if(data.errors){
			return
		}
		adder(data)
		return
	}
})
//end modules/addForumMedia.js
//begin modules/addForumMediaNoAWC.js
async function addForumMediaNoAWC(){
	if(location.pathname !== "/home"){
		return
	}
	let buildPreview = function(data){
		if(location.pathname !== "/home"){
			return
		}
		let forumPreview = document.querySelector(".recent-threads .forum-wrap");
		if(!(forumPreview && forumPreview.childElementCount)){
			setTimeout(function(){buildPreview(data)},400);
			return;
		}
		forumPreview.classList.add("hohNoAWC");
		removeChildren(forumPreview)
		data.Page.threads.filter(
			thread => !(
				(useScripts.hideAWC && thread.title.match(/^(AWC|Anime\sWatching\s(Challenge|Club)|MRC)/))
				|| (useScripts.hideOtherThreads && thread.title.match(/(Boys\svs\sGirls|New\sUser\sIntro\sThread|Support\sAniList\s&\sAniChart|Where\scan\sI\s(watch|read|find))/i))
			)
		).slice(0,parseInt(useScripts.forumPreviewNumber)).forEach(thread => {
			let card = create("div",["thread-card","small"],false,forumPreview);
			create("a","title",thread.title,card).href = "/forum/thread/" + thread.id;
			let footer = create("div","footer",false,card);
			let avatar = create("a","avatar",false,footer);
			avatar.href = "/user/" + (thread.replyUser || thread.user).name;
			avatar.style.backgroundImage = "url(\"" + (thread.replyUser || thread.user).avatar.large + "\")";
			let name = create("div","name",false,footer);
			if(thread.replyCount === 0){
				let contextText = create("a",false,translate("$particle_by"),name);
				name.appendChild(document.createTextNode(" "));
				let nameWrap = create("a",false,false,name);
				nameWrap.href = (thread.replyUser || thread.user).name;
				contextText.href = "/forum/thread/" + thread.id + "/comment/" + thread.replyCommentId;
				let nameInner = create("span",false,(thread.replyUser || thread.user).name,nameWrap);
			}
			else if(!thread.replyUser){
				let contextText = create("a",false,translate("$particle_by"),name);
				name.appendChild(document.createTextNode(" "));
				let nameWrap = create("a",false,false,name);
				nameWrap.href = "/user/" + thread.user.name;
				contextText.href = "/forum/thread/" + thread.id;
				let nameInner = create("span",false,thread.user.name,nameWrap);
			}
			else{
				let nameWrap = create("a",false,false,name);
				nameWrap.href = "/user/" + thread.replyUser.name;
				let nameInner = create("span",false,thread.replyUser.name,nameWrap);
				name.appendChild(document.createTextNode(" "));
				let contextText = create("a",false,translate("$forum_preview_reply"),name);
				contextText.href = "/forum/thread/" + thread.id + "/comment/" + thread.replyCommentId;
				let timer = nativeTimeElement(thread.repliedAt);
				timer.style.position = "relative";
				timer.style.right = "unset";
				timer.style.top = "unset";
				timer.style.fontSize = "1.3rem";
				contextText.appendChild(timer);
			}
			let categories = create("div","categories",false,footer);
			thread.categories.forEach(category => {
				category.name = translate("$forumCategory_" + category.id,null,category.name)
			});
			if(thread.mediaCategories.length === 0){
				if(thread.categories.length){
					let catWrap = create("span",false,false,categories);
					let category = create("a",["category","default"],thread.categories[0].name,catWrap);
					category.href = "/forum/recent?category=" + thread.categories[0].id;
					category.style.background = (categoryColours.get(thread.categories[0].id) || "rgb(78, 163, 230)") + " none repeat scroll 0% 0%";
				}
			}
			else{
				let mediaTitle = titlePicker(thread.mediaCategories[0]);
				if(mediaTitle.length > 25){
					mediaTitle = mediaTitle.replace(/(2nd|Second) Season/,"2").replace(/\((\d+)\)/g,(string,year) => year);
					let lastIndex = mediaTitle.slice(0,25).lastIndexOf(" ");
					if(lastIndex > 20){
						mediaTitle.slice(0,lastIndex);
					}
					else{
						mediaTitle = mediaTitle.slice(0,20)
					}
				}
				let catWrap;
				if(
					thread.categories.length && thread.categories[0].id !== 1 && thread.categories[0].id !== 2
					&& !(mediaTitle.length > 30 && thread.categories[0].id === 5)//give priority to showing the whole title if it's just a release discussion
				){
					catWrap = create("span",false,false,categories);
					let category = create("a",["category","default"],thread.categories[0].name,catWrap);
					category.href = "/forum/recent?category=" + thread.categories[0].id;
					category.style.background = (categoryColours.get(thread.categories[0].id) || "rgb(78, 163, 230)") + " none repeat scroll 0% 0%";
				}
				catWrap = create("span",false,false,categories);
				let mediaCategory = create("a","category",mediaTitle,catWrap);
				mediaCategory.href = "/forum/recent?media=" + thread.mediaCategories[0].id;
				mediaCategory.style.background = (thread.mediaCategories[0].type === "ANIME" ? "rgb(var(--color-blue))" : "rgb(var(--color-green))") + " none repeat scroll 0% 0%";
			}
			let info = create("div","info",false,footer);
			let viewCount = create("span",false,false,info);
			viewCount.appendChild(svgAssets2.eye.cloneNode(true));
			viewCount.appendChild(document.createTextNode(" "));
			viewCount.appendChild(create("span",false,thread.viewCount,false,"padding-left: 0px;"))
			if(thread.replyCount){
				info.appendChild(document.createTextNode(" "));
				let replyCount = create("span",false,false,info);
				replyCount.appendChild(svgAssets2.reply.cloneNode(true));
				replyCount.appendChild(document.createTextNode(" "));
				replyCount.appendChild(create("span",false,thread.replyCount,false,"padding-left: 0px;"))
			}
		})
	};
	if(useScripts.forumPreviewNumber > 0){
		const {data, errors} = await anilistAPI(
			`query{
				Page(perPage:${parseInt(useScripts.forumPreviewNumber) + 12},page:1){
					threads(sort:REPLIED_AT_DESC){
						id
						viewCount
						replyCount
						title
						repliedAt
						replyCommentId
						user{
							name
							avatar{large}
						}
						replyUser{
							name
							avatar{large}
						}
						categories{
							id
							name
						}
						mediaCategories{
							id
							type
							title{romaji native english}
						}
					}
				}
			}`
		);
		if(errors){
			return
		}
		buildPreview(data)
	}
	return
}
//end modules/addForumMediaNoAWC.js
//begin modules/addForumMediaTitle.js
async function addForumMediaTitle(){
	if(location.pathname !== "/home"){
		return
	}
	// Forum previews may contain multiple categories but only show the first one
	let forumThreads = Array.from(document.querySelectorAll(".home .forum-wrap .thread-card .categories span:first-child .category"));
	if(!forumThreads.length){
		setTimeout(addForumMediaTitle,200);
		return;
	}
	if(forumThreads.some(
		thread => thread && ["anime","manga"].includes(thread.innerText.toLowerCase())
	)){
		const {data, errors} = await anilistAPI("query{Page(perPage:3){threads(sort:REPLIED_AT_DESC){title mediaCategories{id title{romaji native english}}}}}");
		if(errors){
			return
		}
		if(location.pathname !== "/home"){
			return
		}
		data.Page.threads.forEach((thread,index) => {
			if(thread.mediaCategories.length && ["anime","manga"].includes(forumThreads[index].innerText.toLowerCase())){
				let title = titlePicker(thread.mediaCategories[0]);
				if(title.length > 40){
					forumThreads[index].title = title;
					title = title.slice(0,35) + "…";
				}
				forumThreads[index].innerText = title;
			}
		})
	}
	return
}
//end modules/addForumMediaTitle.js
//begin modules/addImageFallback.js
function addImageFallback(){
	if(!document.URL.match(/(\/home|\/user\/)/)){
		return
	}
	setTimeout(addImageFallback,1000);
	let mediaImages = document.querySelectorAll(".media-preview-card:not(.hohFallback) .content .title");
	mediaImages.forEach(cover => {
		cover.parentNode.parentNode.classList.add("hohFallback");
		if(cover.parentNode.parentNode.querySelector(".hohFallback")){
			return
		}
		let fallback = create("span","hohFallback",cover.textContent,cover.parentNode.parentNode);
		if(useScripts.titleLanguage === "ROMAJI"){
			fallback.textContent = cover.textContent;
		}
	})
}
//end modules/addImageFallback.js
//begin modules/addMALscore.js
async function addMALscore(type,id){
	if(!location.pathname.match(/^\/(anime|manga)/)){
		return
	}
	let MALscore = document.getElementById("hohMALscore");
	if(MALscore){
		if(parseInt(MALscore.dataset.id) === id){
			return
		}
		else{
			MALscore.remove()
		}
	}
	let MALserial = document.getElementById("hohMALserialization");
	if(MALserial){
		if(parseInt(MALserial.dataset.id) === id){
			return
		}
		else{
			MALserial.remove()
		}
	}
	let possibleReleaseStatus = Array.from(document.querySelectorAll(".data-set .type"));
	if(useScripts.MALscore === false && useScripts.MALserial === true && useScripts.MALrecs === false && type === "anime"){
		//there can't be magazine data on anime
		return
	}
	const MALlocation = possibleReleaseStatus.find(element => element.innerText === "Mean Score");
	if(MALlocation){
		MALscore = create("div","data-set");
		MALscore.id = "hohMALscore";
		MALscore.dataset.id = id;
		MALlocation.parentNode.parentNode.insertBefore(MALscore,MALlocation.parentNode.nextSibling);
		if(type === "manga"){
			MALserial = create("div","data-set");
			MALserial.id = "hohMALserialization";
			MALserial.dataset.id = id;
			MALlocation.parentNode.parentNode.insertBefore(MALserial,MALlocation.parentNode.nextSibling.nextSibling)
		}
		const data = await anilistAPI("query($id:Int){Media(id:$id){idMal}}", {
			variables: {id},
			cacheKey: "hohIDmal" + id,
			duration: 30*60*1000
		});
		if(data.errors){
			return
		}
		if(data.data.Media.idMal){
			let handler = function(response){
				let score = response.responseText.match(/ratingValue.+?(\d+\.\d+)/);
				if(score && useScripts.MALscore){
					MALscore.style.paddingBottom = "14px";
					create("a",["type","newTab","external"],translate("$MAL_score"),MALscore)
						.href = "https://myanimelist.net/" + type + "/" + data.data.Media.idMal;
					create("div","value",score[1],MALscore)
				}
				if(type === "manga" && useScripts.MALserial){
					let serialization = response.responseText.match(/Serialization:<\/span>\n.*?href="(.*?)"\stitle="(.*?)"/);
					if(serialization){
						create("div","type",translate("$MAL_serialization"),MALserial);
						let link = create("a",["value","newTab","external"],serialization[2].replace(/&#039;/g,"'").replace(/&quot;/g,'"'),MALserial)
						link.href = "https://myanimelist.net" + serialization[1]
					}
				}
				let adder = function(){
					let possibleOverview = document.querySelector(".overview .grid-section-wrap:last-child");
					if(!possibleOverview){
						setTimeout(adder,500);
						return
					}
					(possibleOverview.querySelector(".hohRecContainer") || {remove: ()=>{}}).remove();
					let recContainer = create("div",["grid-section-wrap","hohRecContainer"],false,possibleOverview);
					create("h2",false,"MAL Recommendations",recContainer);
					let pattern = /class="picSurround"><a href="https:\/\/myanimelist\.net\/(anime|manga)\/(\d+)\/[\s\S]*?detail-user-recs-text.*?">([\s\S]*?)<\/div>/g;
					let matching = [];
					let matchingItem;
					while((matchingItem = pattern.exec(response.responseText)) && matching.length < 5){//single "=" is intended, we are setting the value of each match, not comparing
						matching.push(matchingItem)
					}
					if(!matching.length){
						recContainer.style.display = "none"
					}
					matching.forEach(async function(item){
						let idMal = item[2];
						let description = item[3];
						let rec = create("div","hohRec",false,recContainer);
						let recImage = create("a","hohBackgroundCover",false,rec,"border-radius: 3px;");
						let recTitle = create("a","title",false,rec,"position:absolute;top:35px;left:80px;color:rgb(var(--color-blue));");
						recTitle.innerText = "MAL ID " + idMal;
						let recDescription = create("p",false,false,rec,"font-size: 1.4rem;line-height: 1.5;");
						recDescription.innerText = new DOMParser().parseFromString(description, 'text/html').body.textContent.replace(/\s*?read more\s*?$/,"") || "";
						const reverseData = await anilistAPI(
							"query($idMal:Int,$type:MediaType){Media(idMal:$idMal,type:$type){id title{romaji native english} coverImage{large color} siteUrl}}",
							{
								variables: {idMal:idMal,type:item[1].toUpperCase()},
								cacheKey: "hohIDmalReverse" + idMal,
								duration: 30*60*1000
							}
						);
						if(reverseData.errors){
							return
						}
						recImage.style.backgroundColor = reverseData.data.Media.coverImage.color || "rgb(var(--color-foreground))";
						recImage.style.backgroundImage = "url(\"" + reverseData.data.Media.coverImage.large + "\")";
						recImage.href = reverseData.data.Media.siteUrl;
						cheapReload(recImage,{path: recImage.pathname})
						recTitle.innerText = titlePicker(reverseData.data.Media);
						recTitle.href = reverseData.data.Media.siteUrl
						cheapReload(recTitle,{path: recTitle.pathname})
						return
					})
				};
				if(useScripts.MALrecs){
					adder()
				}
			}
			if(typeof GM_xmlhttpRequest === "function"){
				GM_xmlhttpRequest({
					method: "GET",
					anonymous: true,
					url: "https://myanimelist.net/" + type + "/" + data.data.Media.idMal + "/placeholder/userrecs",
					onload: function(response){handler(response)}
				})
			}
			else{
				let oReq = new XMLHttpRequest();
				oReq.addEventListener("load",function(){handler(this)});
				oReq.open("GET","https://myanimelist.net/" + type + "/" + data.data.Media.idMal + "/placeholder/userrecs");
				oReq.send()
			}
		}
	}
	else{
		setTimeout(() => {addMALscore(type,id)},200)
	}
	return
}
//end modules/addMALscore.js
//begin modules/addMediaReviewConfidence.js
exportModule({
	id: "addMediaReviewConfidence",
	description: "$addMediaReviewConfidence_description",
	isDefault: true,
	categories: ["Media"],
	visible: true,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/(anime|manga)\/[0-9]+\/(.*\/)?reviews/.test(url)
	},
	code: function(){
		const [,id] = location.pathname.match(/^\/(?:anime|manga)\/([0-9]+)\/(.*\/)?reviews/)
		const query = `
query media($id: Int, $page: Int) {
	Media(id: $id) {
		reviews(page: $page, sort: [RATING_DESC, ID]) {
			pageInfo {
				total
				perPage
				hasNextPage
			}
			nodes {
				id
				rating
				ratingAmount
			}
		}
	}
}
`
		let pageCount = 0;
		let reviewCount = 0;

		const addConfidence = async function(){
			pageCount++
			const {data, errors} = await anilistAPI(query, {
				variables: {id, page: pageCount},
				cacheKey: "recentMediaReviews" + id + "Page" + pageCount,
				duration: 30*60*1000
			})
			if(errors){
				return;
			}
			const adder = function(){
				const reviewWrap = document.querySelector(".media-reviews .review-wrap");
				if(!reviewWrap){
					setTimeout(adder,200);
					return;
				}
				data.Media.reviews.nodes.forEach(review => {
					reviewCount++
					const wilsonLowerBound = wilson(review.rating,review.ratingAmount).left
					const extraScore = create("span",false,"~" + Math.round(100*wilsonLowerBound));
					extraScore.style.color = "hsl(" + wilsonLowerBound*120 + ",100%,50%)";
					extraScore.style.marginRight = "3px";
					const findParent = function(){
						const parent = reviewWrap.querySelector('[href="/review/' + review.id + '"] .votes');
						if(!parent){
							setTimeout(findParent,200);
							return;
						}
						parent.insertBefore(extraScore,parent.firstChild);
						if(wilsonLowerBound < 0.05){
							reviewWrap.children[reviewCount - 1].style.opacity = "0.5"
						}
					}; findParent();
				})
				return;
			};adder();
		}
		addConfidence()

		const checkMore = function(){
			const loadMore = document.querySelector(".media-reviews .load-more");
			if(!loadMore){
				setTimeout(checkMore,200);
				return;
			}
			loadMore.addEventListener("click", addConfidence)
		};checkMore();
	},
	css: `
	.media-reviews .review-wrap .review-card .summary {
		margin-bottom: 15px;
	}
	`
})
//end modules/addMediaReviewConfidence.js
//begin modules/addMoreStats.js
exportModule({
	id: "moreStats",
	description: "$setting_moreStats",
	extendedDescription: `
On every users' stats page, there will be an additonal tab called "more stats".
The "more stats" page also has a section for running various statistical queries about the site or specific users.

There will also be a tab called "Genres & Tags", which contains aggregate stats for anime and manga.

In addition, the individual sections for anime/manga staff and tags will have full tables not limited to the default 30.
In these tables, you can click the rows to see the individual works contributing to the stats.
	`,
	isDefault: true,
	importance: 9,
	categories: ["Stats"],
	visible: true
})

function addMoreStats(){
	if(!document.URL.match(/\/stats\/?/)){
		return
	}
	if(document.querySelector(".hohStatsTrigger")){
		return
	}
	let filterGroup = document.querySelector(".filter-wrap");
	if(!filterGroup){
		setTimeout(function(){
			addMoreStats()
		},200);//takes some time to load
		return;
	}
	let hohStats;
	let hohGenres;
	let regularFilterHeading;
	let regularGenresTable;
	let regularTagsTable;
	let regularAnimeTable;
	let regularMangaTable;
	let animeStaff;
	let mangaStaff;
	let animeStudios;
	let hohStatsTrigger = create("span","hohStatsTrigger",translate("$stats_moreStats_title"),filterGroup);
	let hohGenresTrigger = create("span","hohStatsTrigger",translate("$stats_genresTags_title"),filterGroup);
	let hohSiteStats = create("a","hohStatsTrigger",translate("$stats_siteStats_title"),filterGroup);
	hohSiteStats.href = "/site-stats";
	cheapReload(hohSiteStats,{name: "SiteStats"});
	let generateStatPage = async function(){
		let personalStats = create("div","#personalStats",translate("$stats_loadingAnime"),hohStats);
		let personalStatsManga = create("div","#personalStatsManga",translate("$stats_loadingManga"),hohStats);
		let miscQueries = create("div","#miscQueries",false,hohStats);
		create("hr","hohSeparator",false,miscQueries);
		create("h1","hohStatHeading",translate("$stats_varousStats_heading"),miscQueries);
		let miscInput = create("div",false,false,miscQueries,"padding-top:10px;padding-bottom:10px;");
		let miscOptions = create("div","#queryOptions",false,miscQueries);
		let miscResults = create("div","#queryResults",false,miscQueries);
		let nameContainer = document.querySelector(".banner-content h1.name");
		let user;
		if(nameContainer){
			user = nameContainer.innerText
		}
		else{
			user = decodeURIComponent(document.URL.match(/user\/(.+)\/stats\/?/)[1])
		}
		const loginMessage = "Requires being signed in to the script. You can do that at the bottom of the settings page https://anilist.co/settings/apps";
		let statusSearchCache = [];
		let availableQueries = [
			m4_include(queries/queries.js)
		];
		let miscInputSelect = create("select",false,false,miscInput);
		let miscInputButton = create("button",["button","hohButton"],translate("$button_run"),miscInput);
		availableQueries.forEach(que => {
			create("option",false,que.name,miscInputSelect).value = que.name
		});
		miscInputSelect.oninput = function(){
			miscOptions.innerText = "";
			let relevant = availableQueries.find(que => que.name === miscInputSelect.value);
			miscResults.innerText = "";
			if(relevant.setup){
				relevant.setup()
			}
		};
		miscInputButton.onclick = function(){
			miscResults.innerText = translate("$loading");
			availableQueries.find(que => que.name === miscInputSelect.value).code()
		}

		let customTagsCollection = function(list,title,fields){
			let customTags = new Map();
			let regularTags = new Map();
			let customLists = new Map();
			(
				JSON.parse(localStorage.getItem("regularTags" + title)) || []
			).forEach(
				tag => regularTags.set(tag,{
					name : tag,
					list : []
				})
			);
			customLists.set("Not on custom list",{name: "Not on custom list",list: []});
			customLists.set("All media",{name: "All media",list: []});
			list.forEach(media => {
				let item = {};
				fields.forEach(field => {
					item[field.key] = field.method(media)
				});
				if(media.notes){
					(
						media.notes.match(/(#(\\\s|\S)+)/g) || []
					).filter(
						tagMatch => !tagMatch.match(/^#039/)
					).map(
						tagMatch => evalBackslash(tagMatch)
					).forEach(tagMatch => {
						if(!customTags.has(tagMatch)){
							customTags.set(tagMatch,{name: tagMatch,list: []})
						}
						customTags.get(tagMatch).list.push(item)
					});
					(//candidates for multi word tags, which we try to detect even if they are not allowed
						media.notes.match(/(#\S+ [^#]\S+)/g) || []
					).filter(
						tagMatch => !tagMatch.match(/^#039/)
					).map(
						tagMatch => evalBackslash(tagMatch)
					).forEach(tagMatch => {
						if(!customTags.has(tagMatch)){
							customTags.set(tagMatch,{name: tagMatch,list: []})
						}
						customTags.get(tagMatch).list.push(item)
					})
				}
				media.media.tags.forEach(mediaTag => {
					if(regularTags.has(mediaTag.name)){
						regularTags.get(mediaTag.name).list.push(item)
					}
				});
				if(media.isCustomList){
					media.listLocations.forEach(location => {
						if(!customLists.has(location)){
							customLists.set(location,{name: location,list: []})
						}
						customLists.get(location).list.push(item)
					})
				}
				else if(useScripts.negativeCustomList){
					customLists.get("Not on custom list").list.push(item)
				}
				if(useScripts.globalCustomList){
					customLists.get("All media").list.push(item)
				}
			});
			if(customTags.has("##STRICT")){
				customTags.delete("##STRICT")
			}
			else{
				for(let [key,value] of customTags){//filter our multi word candidates
					if(key.includes(" ")){
						if(value.list.length === 1){//if it's just one of them, the prefix tag takes priority
							customTags.delete(key)
						}
						else{
							let prefix = key.split(" ")[0];
							if(customTags.has(prefix)){
								if(customTags.get(prefix).list.length === value.list.length){
									customTags.delete(prefix)
								}
								else{
									customTags.delete(key)
								}
							}
						}
					}
				}
				for(let [key,value] of customTags){//fix the basic casing error, like #shoujo vs #Shoujo. Will only merge if one is of length 1
					if(key[1] === key[1].toUpperCase()){
						let lowerCaseKey = "#" + key[1].toLowerCase() + key.slice(2);
						let lowerCaseValue = customTags.get(lowerCaseKey);
						if(lowerCaseValue){
							if(value.list.length === 1){
								lowerCaseValue.list = lowerCaseValue.list.concat(value.list);
								customTags.delete(key)
							}
							else if(lowerCaseValue.list.length === 1){
								value.list = value.list.concat(lowerCaseValue.list);
								customTags.delete(lowerCaseKey)
							}
						}
					}
				}
			}
			if(!customLists.get("Not on custom list").list.length){
				customLists.delete("Not on custom list")
			}
			if(!customLists.get("All media").list.length){
				customLists.delete("All media")
			}
			return [...customTags, ...regularTags, ...customLists].map(
				pair => pair[1]
			).map(tag => {
				let amountCount = 0;
				let average = 0;
				tag.list.forEach(item => {
					if(item.score !== 0){
						amountCount++;
						average += item.score;
					}
					fields.forEach(field => {
						if(field.sumable){
							tag[field.key] = field.sumable(tag[field.key],item[field.key]);
						}
					})
				});
				tag.average = average/amountCount || 0;
				tag.list.sort((b,a) => a.score - b.score);
				return tag;
			}).sort(
				(b,a) => a.list.length - b.list.length || b.name.localeCompare(a.name)
			)
		};
		let regularTagsCollection = function(list,fields,extracter,settings){
			settings = settings || {avg: "average"};
			let tags = new Map();
			list.forEach(media => {
				let item = {};
				fields.forEach(field => {
					item[field.key] = field.method(media)
				});
				extracter(media).forEach(tag => {
					if(useScripts.SFWmode && tag.name === "Hentai"){
						return
					}
					if(!tags.has(tag.name)){
						tags.set(tag.name,{name: tag.name,list: []})
					}
					tags.get(tag.name).list.push(item)
				})
			});
			tags.forEach(tag => {
				tag.amountCount = 0;
				tag.average = 0;
				if(settings.avg === "average"){
					tag.list.forEach(item => {
						if(item.score){
							tag.amountCount++;
							tag.average += item.score;
						}
						fields.forEach(field => {
							if(field.sumable){
								tag[field.key] = field.sumable(tag[field.key],item[field.key])
							}
						})
					});
					tag.average = tag.average/tag.amountCount || 0;
				}
				else if(settings.avg === "max"){
					let maxi = 0
					tag.list.forEach(item => {
						if(item.score){
							tag.amountCount++;
							maxi = Math.max(maxi,item.score)
						}
						fields.forEach(field => {
							if(field.sumable){
								tag[field.key] = field.sumable(tag[field.key],item[field.key])
							}
						})
					});
					tag.average = maxi || 0;
				}
				else if(settings.avg === "min"){
					let maxi = 100;
					tag.list.forEach(item => {
						if(item.score){
							tag.amountCount++;
							maxi = Math.min(maxi,item.score)
						}
						fields.forEach(field => {
							if(field.sumable){
								tag[field.key] = field.sumable(tag[field.key],item[field.key])
							}
						})
					});
					tag.average = maxi;
					if(tag.amountCount){
						tag.average = 0
					}
				}
				else if(settings.avg === "avg0"){
					tag.list.forEach(item => {
						if(item.score){
							tag.amountCount++;
							tag.average += item.score;
						}
						fields.forEach(field => {
							if(field.sumable){
								tag[field.key] = field.sumable(tag[field.key],item[field.key])
							}
						})
					});
					tag.average = tag.average/(1+tag.amountCount) || 0;
				}
				else if(settings.avg === "median"){
					let listi = []
					tag.list.forEach(item => {
						if(item.score){
							tag.amountCount++;
							listi.push(item.score)
						}
						fields.forEach(field => {
							if(field.sumable){
								tag[field.key] = field.sumable(tag[field.key],item[field.key])
							}
						})
					});
					tag.average = Stats.median(listi) || 0;
				}
				tag.list.sort((b,a) => a.score - b.score)
			});
			return [...tags].map(
				tag => tag[1]
			).sort(
				(b,a) => (a.average*a.amountCount + ANILIST_WEIGHT)/(a.amountCount + 1) - (b.average*b.amountCount + ANILIST_WEIGHT)/(b.amountCount + 1) || a.list.length - b.list.length
			)
		};
		let drawTable = function(data,formatter,tableLocation,settings){
			settings = settings || {};
			let isTag = settings.isTag;
			let autoHide = settings.autoHide;
			removeChildren(tableLocation)
			tableLocation.innerText = "";
			let hasScores = data.some(elem => elem.average);
			let header = create("p",false,formatter.title);
			let tableContent = create("div",["table","hohTable"]);
			let headerRow = create("div",["header","row"],false,tableContent);
			let indexAccumulator = 0;
			formatter.headings.forEach(function(heading){
				if(!hasScores && heading === "Mean Score"){
					return
				}
				let columnTitle = create("div",false,heading,headerRow);
				if((heading === "Tag" || heading === translate("$stats_tag")) && !isTag && formatter.isMixed){
					columnTitle.innerText = translate("$stats_genre")
				}
				if(formatter.focus === indexAccumulator){
					columnTitle.innerText += " ";
					columnTitle.appendChild(svgAssets2.angleDown.cloneNode(true))
				}
				columnTitle.index = +indexAccumulator;
				columnTitle.addEventListener("click",function(){
					formatter.focus = this.index;
					data.sort(formatter.sorting[this.index]);
					drawTable(data,formatter,tableLocation,{isTag: isTag,autoHide: autoHide})
				});
				indexAccumulator++;
			});
			for(let i=0;i<data.length;i++){
				let row = create("div","row");
				formatter.celData.forEach((celData,index) => {
					if(index === 2 && !hasScores){
						return
					}
					celData(
						create("div",false,false,row),
						data,i,true,isTag
					)
				});
				row.onclick = function(){
					if(this.nextSibling.style.display === "none"){
						this.nextSibling.style.display = "block"
					}
					else{
						this.nextSibling.style.display = "none"
					}
				};
				tableContent.appendChild(row);
				let showList = create("div");

				if(formatter.focus === 1){//sorting by count is meaningless, sort alphabetically instead
					data[i].list.sort(formatter.sorting[0])
				}
				else if(formatter.focus === 2){//average != score
					data[i].list.sort((b,a) => a.score - b.score)
				}
				else if(formatter.focus === -1){//average != score
					//nothing, duh
				}
				else{
					data[i].list.sort(formatter.sorting[formatter.focus]);
				}
				data[i].list.forEach((nil,ind) => {
					let secondaryRow = create("div",["row","hohSecondaryRow"]);
					formatter.celData.forEach(celData => {
						let cel = create("div");
						celData(cel,data[i].list,ind,false,isTag);
						secondaryRow.appendChild(cel)
					});
					showList.appendChild(secondaryRow)
				});
				showList.style.display = "none";
				tableContent.insertBefore(showList,row.nextSibling);
			}
			tableLocation.appendChild(header);
			tableLocation.appendChild(tableContent);
			if(autoHide){
				let tableHider = create("span",["hohMonospace","hohTableHider"],"[-]",header);
				let regularTagsSetting = create("p",false,false,tableLocation);
				let regularTagsSettingLabel = create("span",false,translate("$stats_regularTags"),regularTagsSetting);
				let regularTagsSettingContent = create("span",false,false,regularTagsSetting);
				let regularTagsSettingNew = create("input",false,false,regularTagsSetting);
				let regularTagsSettingAdd = create("button",["hohButton","button"],"+",regularTagsSetting);
				let regularTags = JSON.parse(localStorage.getItem("regularTags" + formatter.title)) || [];
				for(let i=0;i<regularTags.length;i++){
					let tag = create("span","hohRegularTag",false,regularTagsSettingContent);
					let tagContent = create("span",false,regularTags[i],tag);
					let tagCross = create("span","hohCross",svgAssets.cross,tag);
					tagCross.regularTag = regularTags[i] + "";
					tagCross.addEventListener("click",function(){
						for(let j=0;j<regularTags.length;j++){
							if(regularTags[j] === this.regularTag){
								regularTags.splice(j,1);
								localStorage.setItem("regularTags" + formatter.title,JSON.stringify(regularTags));
								break
							}
						}
						this.parentNode.remove();
					})
				}
				regularTagsSettingAdd.addEventListener("click",function(){
					let newTagName = this.previousSibling.value;
					if(!newTagName){
						return
					}
					newTagName = capitalize(newTagName);
					regularTags.push(newTagName);
					let tag = create("span","hohRegularTag");
					let tagContent = create("span",false,newTagName,tag);
					let tagCross = create("span","hohCross",svgAssets.cross,tag);
					tagCross.regularTag = newTagName + "";
					tagCross.addEventListener("click",function(){
						for(let j=0;j<regularTags.length;j++){
							if(regularTags[j] === this.regularTag){
								regularTags.splice(j,1);
								localStorage.setItem("regularTags" + formatter.title,JSON.stringify(regularTags));
								break
							}
						}
						this.parentNode.remove();
					});
					this.previousSibling.previousSibling.appendChild(tag);
					localStorage.setItem("regularTags" + formatter.title,JSON.stringify(regularTags));
				});
				tableHider.onclick = function(){
					if(this.innerText === "[-]"){
						tableHider.innerText = "[+]";
						tableContent.style.display = "none";
						regularTagsSetting.style.display = "none";
						formatter.display = false
					}
					else{
						tableHider.innerText = "[-]";
						tableContent.style.display = "block";
						regularTagsSetting.style.display = "block";
						formatter.display = true
					}
				};
				if(!formatter.display){
					tableHider.innerText = "[+]";
					tableContent.style.display = "none";
					regularTagsSetting.style.display = "none";
				}
			}
		};
		let semaPhoreAnime = false;//I have no idea what "semaphore" means in software
		let semaPhoreManga = false;//but it sounds cool so this is a semaphore
//
		let nativeTagsReplacer = function(){
			if(useScripts.replaceNativeTags === false || semaPhoreAnime === false || semaPhoreManga === false){
				return
			}
			const mixedFields = [
				{
					key : "name",
					method : function(media){
						return titlePicker({
							id: media.mediaId,
							title: media.media.title
						})
					}
				},{
					key : "repeat",
					method : media => media.repeat
				},{
					key : "status",
					sumable : function(acc,val){
						if(!acc){
							acc = {};
							Object.keys(distributionColours).forEach(function(key){
								acc[key] = 0
							})
						}
						acc[val]++;
						return acc;
					},
					method : media => media.status
				},{
					key : "type",
					method : function(media){
						if(!media.progressVolumes && !(media.progressVolumes === 0)){
							return "ANIME"
						}
						return "MANGA"
					}
				},{
					key : "mediaId",
					method : media => media.mediaId
				},{
					key : "score",
					method : media => media.scoreRaw
				},{
					key : "duration",
					sumable : ACCUMULATE,
					method : media => media.watchedDuration || 0
				},{
					key : "chaptersRead",
					sumable : ACCUMULATE,
					method : media => media.chaptersRead || 0
				}
			];
			let mixedFormatter = {
				title: "",
				display: true,
				isMixed: true,
				headings: [translate("$stats_tag"),translate("$stats_count"),"Mean Score","Time Watched","Chapters Read"],
				focus: -1,
				anime: true,
				manga: true,
				celData: [
					function(cel,data,index,isPrimary,isTag){
						if(isPrimary){
							let nameCellCount = create("div","count",(index+1),cel);
							let nameCellTag = create("a",false,data[index].name,cel,"cursor:pointer;");
							if(isTag){
								if(mixedFormatter.anime && data[index].list.some(media => media.type === "ANIME")){
									nameCellTag.href = "/search/anime?includedTags=" + data[index].name + "&onList=true";
								}
								else{
									nameCellTag.href = "/search/manga?includedTags=" + data[index].name + "&onList=true"
								}
							}
							else{
								if(mixedFormatter.anime && data[index].list.some(media => media.type === "ANIME")){
									nameCellTag.href = "/search/anime?includedGenres=" + data[index].name + "&onList=true"
								}
								else{
									nameCellTag.href = "/search/manga?includedGenres=" + data[index].name + "&onList=true"
								}
								if(data[index].name === "Hentai"){
									nameCellTag.href += "&adult=true"
								}
							}
							let nameCellStatus = create("span","hohSummableStatusContainer",false,cel);
							semmanticStatusOrder.forEach(function(status){
								if(data[index].status[status]){
									let statusSumDot = create("div","hohSummableStatus",data[index].status[status],nameCellStatus);
									statusSumDot.style.background = distributionColours[status];
									statusSumDot.title = data[index].status[status] + " " + capitalize(statusTypes[status]);
									if(data[index].status[status] > 99){
										statusSumDot.style.fontSize = "8px"
									}
									if(data[index].status[status] > 999){
										statusSumDot.style.fontSize = "6px"
									}
									statusSumDot.onclick = function(e){
										e.stopPropagation();
										Array.from(cel.parentNode.nextSibling.children).forEach(child => {
											if(child.children[1].children[0].title === status.toLowerCase()){
												child.style.display = "grid"
											}
											else{
												child.style.display = "none"
											}
										})
									}
								}
							})
						}
						else{
							let nameCellTag = create("a",["title","hohNameCel"],data[index].name,cel);
							if(data[index].type === "ANIME"){
								nameCellTag.href = "/anime/" + data[index].mediaId + "/";
								nameCellTag.style.color = "rgb(var(--color-blue))"
							}
							else{
								nameCellTag.href = "/manga/" + data[index].mediaId + "/";
								nameCellTag.style.color = "rgb(var(--color-green))"
							}
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							cel.innerText = data[index].list.length
						}
						else{
							let statusDot = create("div","hohStatusDot",false,cel);
							statusDot.style.backgroundColor = distributionColours[data[index].status];
							statusDot.title = data[index].status.toLowerCase();
							if(data[index].status === "COMPLETED"){
								statusDot.style.backgroundColor = "transparent"//default case
							}
							if(data[index].repeat === 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true))
							}
							else if(data[index].repeat > 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true));
								create("span",false,data[index].repeat,cel)
							}
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							cel.innerText = (data[index].average).roundPlaces(1) || "-"
						}
						else{
							cel.innerText = (data[index].score).roundPlaces(1) || "-"
						}
					},
					function(cel,data,index,isPrimary){
						if(!isPrimary && data[index].type === "MANGA"){
							cel.innerText = "-"
						}
						else if(data[index].duration === 0){
							cel.innerText = "-"
						}
						else if(data[index].duration < 60){
							cel.innerText = Math.round(data[index].duration) + "min"
						}
						else{
							cel.innerText = Math.round(data[index].duration/60) + "h"
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary || data[index].type === "MANGA"){
							cel.innerText = data[index].chaptersRead;
						}
						else{
							cel.innerText = "-"
						}
					}
				],
				sorting : [
					ALPHABETICAL(a => a.name),
					(b,a) => a.list.length - b.list.length,
					(b,a) => a.average - b.average,
					(b,a) => a.duration - b.duration,
					(b,a) => a.chaptersRead - b.chaptersRead
				]
			};
			let collectedMedia = semaPhoreAnime.concat(semaPhoreManga);
			let listOfTags = regularTagsCollection(collectedMedia,mixedFields,media => media.media.tags);
			if(!document.URL.match(/\/stats/)){
				return
			}
			let drawer = function(){
				if(regularFilterHeading.children.length === 0){
					let filterWrap = create("div",false,false,regularFilterHeading);
					create("p",false,"tip: click a row to show individual media entries",regularFilterHeading);
					let filterLabel = create("span",false,translate("$filters"),filterWrap);
					let tableHider = create("span",["hohMonospace","hohTableHider"],"[+]",filterWrap);
					let filters = create("div",false,false,filterWrap,"display: none");

					let animeSetting = create("p","hohSetting",false,filters);
					let input_a = createCheckbox(animeSetting);
					input_a.checked = true;
					create("span",false,translate("$generic_anime"),animeSetting);

					let mangaSetting = create("p","hohSetting",false,filters);
					let input_m = createCheckbox(mangaSetting);
					input_m.checked = true;
					create("span",false,translate("$generic_manga"),mangaSetting);

					let minSetting = create("p","hohSetting",false,filters);
					let min_s_input = create("input","hohNativeInput",false,minSetting,"width: 80px;margin-right: 10px;");
					min_s_input.type = "number";
					min_s_input.min = 0;
					min_s_input.max = 100;
					min_s_input.step = 1;
					min_s_input.value = 0;
					create("span",false,"Minimum rating",minSetting);

					let minEpisodeSetting = create("p","hohSetting",false,filters);
					let min_e_input = create("input","hohNativeInput",false,minEpisodeSetting,"width: 80px;margin-right: 10px;");
					min_e_input.type = "number";
					min_e_input.min = 0;
					min_e_input.step = 1;
					min_e_input.value = 0;
					create("span",false,"Minimum episode progress",minEpisodeSetting);

					let minChapterSetting = create("p","hohSetting",false,filters);
					let min_c_input = create("input","hohNativeInput",false,minChapterSetting,"width: 80px;margin-right: 10px;");
					min_c_input.type = "number";
					min_c_input.min = 0;
					min_c_input.step = 1;
					min_c_input.value = 0;
					create("span",false,"Minimum chapter progress",minChapterSetting);

					let statusFilter = {};
					create("p",false,"Status",filters);
					let statusLine = create("p","hohSetting",false,filters);
					Object.keys(statusTypes).sort().forEach(key => {
						statusFilter[key] = true;
						let input_status = createCheckbox(statusLine);
						input_status.checked = true;
						create("span",false,capitalize(statusTypes[key]),statusLine,"margin-right: 20px");
						input_status.onchange = function(){
							statusFilter[key] = input_status.checked
						}
					})

					let formatFilter = {};
					create("p",false,"Format",filters);
					let formatLine_a = create("p","hohSetting",false,filters);
					let formatLine_m = create("p","hohSetting",false,filters);
					Object.keys(distributionFormats).forEach(key => {
						formatFilter[key] = true;
						let input_format;
						if(["MANGA","NOVEL","ONE_SHOT"].includes(key)){
							input_format = createCheckbox(formatLine_m);
							create("span",false,distributionFormats[key],formatLine_m,"margin-right: 20px")
						}
						else{
							input_format = createCheckbox(formatLine_a);
							create("span",false,distributionFormats[key],formatLine_a,"margin-right: 20px")
						}
						input_format.checked = true;
						input_format.onchange = function(){
							formatFilter[key] = input_format.checked
						}
					})

					create("p",false,"Aggregate mean score calculation",filters);
					let modeSelect = create("select","hohSetting",false,filters);
					create("option",false,"Average",modeSelect).value = "average";
					create("option",false,"Median",modeSelect).value = "median";
					create("option",false,"Max",modeSelect).value = "max";
					create("option",false,"Min",modeSelect).value = "min";
					create("option",false,"0-weighted Average",modeSelect).value = "avg0";
					modeSelect.value = "average";//default

					input_m.onchange = function(){
						if(input_m.checked){
							minChapterSetting.style.opacity = 1;
							formatLine_m.style.opacity = 1;
						}
						else{
							input_a.checked = true;
							minEpisodeSetting.style.opacity = 1;
							minChapterSetting.style.opacity = 0.5;
							formatLine_m.style.opacity = 0.5;
							formatLine_a.style.opacity = 1;
						}
					}
					input_a.onchange = function(){
						if(input_a.checked){
							minEpisodeSetting.style.opacity = 1;
							formatLine_a.style.opacity = 1;
						}
						else{
							input_m.checked = true;
							minEpisodeSetting.style.opacity = 0.5;
							minChapterSetting.style.opacity = 1;
							formatLine_m.style.opacity = 1;
							formatLine_a.style.opacity = 0.5;
						}
					}

					create("br",false,false,filters);

					let applyButton = create("button",["hohButton","button"],translate("$button_submit"),filters);
					applyButton.onclick = function(){
						let base_media = collectedMedia;
						if(!input_a.checked){
							base_media = semaPhoreManga
						}
						else if(!input_m.checked){
							base_media = semaPhoreAnime
						}
						mixedFormatter.anime = input_a.checked;
						mixedFormatter.manga = input_m.checked;
						base_media = base_media.filter(mediaEntry => {
							if(hasOwn(mediaEntry, "progressVolumes")){
								if(mediaEntry.progress < parseInt(min_c_input.value)){
									return false
								}
							}
							else{
								if(mediaEntry.progress < parseInt(min_e_input.value)){
									return false
								}
							}
							return mediaEntry.scoreRaw >= parseInt(min_s_input.value)
								&& statusFilter[mediaEntry.status]
								&& formatFilter[mediaEntry.media.format]
						})
						listOfTags = regularTagsCollection(base_media,mixedFields,media => media.media.tags,{avg: modeSelect.value});
						drawTable(listOfTags,mixedFormatter,regularTagsTable,{isTag: true});
						drawTable(
							regularTagsCollection(
								base_media,
								mixedFields,
								media => media.media.genres.map(a => ({name: a})),
								{avg: modeSelect.value}
							),
							mixedFormatter,
							regularGenresTable
						)
					}

					tableHider.onclick = function(){
						if(this.innerText === "[-]"){
							tableHider.innerText = "[+]";
							filters.style.display = "none"
						}
						else{
							tableHider.innerText = "[-]";
							filters.style.display = "block"
						}
					}

				}
				drawTable(listOfTags,mixedFormatter,regularTagsTable,{isTag: true});
				//recycle most of the formatter for genres
				drawTable(
					regularTagsCollection(
						collectedMedia,
						mixedFields,
						media => media.media.genres.map(a => ({name: a}))
					),
					mixedFormatter,
					regularGenresTable
				);
				hohGenresTrigger.removeEventListener("mouseover",drawer);
			}
			hohGenresTrigger.addEventListener("mouseover",drawer);
			if(hohGenresTrigger.classList.contains("hohActive")){
				drawer()
			}
		};
//get anime list
		let personalStatsCallback = async function(data,filterSettings,onlyStats){
			personalStats.innerText = "";
			create("hr","hohSeparator",false,personalStats);

			let regularFilterHeading = create("div",false,false,personalStats,"margin-bottom: 10px;");
			let filterWrap = create("div",false,false,regularFilterHeading);
			let filterLabel = create("span",false,translate("$filters"),filterWrap);
			let tableHider = create("span",["hohMonospace","hohTableHider"],"[+]",filterWrap);
			let filters = create("div",false,false,filterWrap,"display: none");

			let listFilterHeading = create("p",false,translate("$filters_lists"),filters);
			filterSettings = filterSettings || {
				lists: {}
			};
			data.data.MediaListCollection.lists.forEach(mediaList => {
				let listSetting = create("p","hohSetting",false,filters);
				let listSetting_input = createCheckbox(listSetting);
				if(!hasOwn(filterSettings.lists, mediaList.name) || filterSettings.lists[mediaList.name]){
					listSetting_input.checked = true;
					filterSettings.lists[mediaList.name] = true
				}
				listSetting_input.oninput = function(){
					filterSettings.lists[mediaList.name] = listSetting_input.checked
				}
				create("span",false,mediaList.name,listSetting);
			});

			let applyButton = create("button",["hohButton","button"],translate("$button_submit"),filters);
			applyButton.onclick = function(){
				personalStatsCallback(data,filterSettings,true);
			}

			tableHider.onclick = function(){
				if(this.innerText === "[-]"){
					tableHider.innerText = "[+]";
					filters.style.display = "none"
				}
				else{
					tableHider.innerText = "[-]";
					filters.style.display = "block"
				}
			}

			create("h1","hohStatHeading",translate("$stats_anime_heading",user),personalStats);
			let list = returnList({
				data: {
					MediaListCollection: {
						lists: data.data.MediaListCollection.lists.filter(
							mediaList => filterSettings.lists[mediaList.name]
						)
					}
				}
			});
			let scoreList = list.filter(element => element.scoreRaw);
			if(whoAmI && whoAmI !== user){
				let compatabilityButton = create("button",["button","hohButton"],"Compatibility",personalStats);
				let compatLocation = create("div","#hohCheckCompat",false,personalStats);
				compatabilityButton.onclick = function(){
					compatLocation.innerText = translate("$loading");
					compatLocation.style.marginTop = "5px";
					compatCheck(
						scoreList,
						whoAmI,
						"ANIME",
						data => formatCompat(data,compatLocation,user)
					)
				};
			}
			let addStat = function(text,value,comment){//value,value,html
				let newStat = create("p","hohStat",false,personalStats);
				create("span",false,text,newStat);
				create("span","hohStatValue",value,newStat);
				if(comment){
					create("span",false,false,newStat)
						.innerText = comment
				}
			};
//first activity
			let oldest = list.filter(
				item => item.startedAt.year
			).map(
				item => item.startedAt
			).sort((b,a) =>
				(a.year < b.year)
				|| (a.year === b.year && a.month < b.month)
				|| (a.year === b.year && a.month === b.month && a.day < b.day)
			)[0];
//scoring stats
			let previouScore = 0;
			let maxRunLength = 0;
			let maxRunLengthScore = 0;
			let runLength = 0;
			let sumEntries = 0;
			let amount = scoreList.length;
			let sumWeight = 0;
			let sumEntriesWeight = 0;
			let average = 0;
			let median = (scoreList.length ? Stats.median(scoreList.map(e => e.scoreRaw)) : 0);
			let sumDuration = 0;
			let publicDeviation = 0;
			let publicDifference = 0;
			let histogram = new Array(100).fill(0);
			let longestDuration = {
				time: 0,
				name: "",
				status: "",
				rewatch: 0,
				id: 0
			};
			scoreList.sort((a,b) => a.scoreRaw - b.scoreRaw);
			list.forEach(item => {
				let entryDuration = (item.media.duration || 1)*(item.progress || 0);//current round
				item.episodes = item.progress || 0;
				if(useScripts.noRewatches && item.repeat){
					entryDuration = Math.max(
						item.progress || 0,
						item.media.episodes || 1,
					) * (item.media.duration || 1);//first round
					item.episodes = Math.max(
						item.progress || 0,
						item.media.episodes || 1
					)
				}
				else{
					entryDuration += (item.repeat || 0) * Math.max(
						item.progress || 0,
						item.media.episodes || 1
					) * (item.media.duration || 1);//repeats
					item.episodes += (item.repeat || 0) * Math.max(
						item.progress || 0,
						item.media.episodes || 1
					)
				}
				if(item.listJSON && item.listJSON.adjustValue){
					item.episodes = Math.max(0,item.episodes + item.listJSON.adjustValue);
					entryDuration = Math.max(0,entryDuration + item.listJSON.adjustValue*(item.media.duration || 1));
				}
				item.watchedDuration = entryDuration;
				sumDuration += entryDuration;
				if(entryDuration > longestDuration.time){
					longestDuration.time = entryDuration;
					longestDuration.name = item.media.title.romaji;
					longestDuration.status = item.status;
					longestDuration.rewatch = item.repeat;
					longestDuration.id = item.mediaId
				}
			});
			scoreList.forEach(item => {
				sumEntries += item.scoreRaw;
				if(item.scoreRaw === previouScore){
					runLength++;
					if(runLength > maxRunLength){
						maxRunLength = runLength;
						maxRunLengthScore = item.scoreRaw
					}
				}
				else{
					runLength = 1;
					previouScore = item.scoreRaw
				}
				sumWeight += (item.media.duration || 1) * (item.media.episodes || 0);
				sumEntriesWeight += item.scoreRaw*(item.media.duration || 1) * (item.media.episodes || 0);
				histogram[item.scoreRaw - 1]++
			});
			if(amount){
				average = sumEntries/amount
			}
			if(scoreList.length){
				publicDeviation = Math.sqrt(
					scoreList.reduce(function(accum,element){
						if(!element.media.meanScore){
							return accum
						}
						return accum + Math.pow(element.media.meanScore - element.scoreRaw,2)
					},0)/amount
				);
				publicDifference = scoreList.reduce(function(accum,element){
					if(!element.media.meanScore){
						return accum
					}
					return accum + (element.scoreRaw - element.media.meanScore)
				},0)/amount
			}
			list.sort((a,b) => a.mediaId - b.mediaId);
//display scoring stats
			addStat(translate("$stats_animeOnList"),list.length);
			addStat(translate("$stats_animeRated"),amount);
			if(amount !== 0){//no scores
				if(amount === 1){
					addStat(translate("$stats_onlyOne"),maxRunLengthScore)
				}
				else{
					addStat(
						translate("$stats_averageScore"),
						average.toPrecision(4)
					);
					addStat(
						translate("$stats_averageScore"),
						(sumEntriesWeight/sumWeight).toPrecision(4),
						translate("$stats_weightComment_duration")
					);
					addStat(translate("$stats_medianScore"),median);
					addStat(
						translate("$stats_globalDifference"),
						publicDifference.roundPlaces(2),
						translate("$stats_globalDifference_comment")
					);
					addStat(
						translate("$stats_globalDeviation"),
						publicDeviation.roundPlaces(2),
						translate("$stats_globalDeviation_comment")
					);
					addStat(
						translate("$stats_ratingEntropy"),
						-histogram.reduce((acc,val) => {
							if(val){
								return acc + Math.log2(val/amount) * val/amount
							}
							return acc
						},0).toPrecision(3),
						translate("$stats_ratingEntropy_comment")
					);
					if(maxRunLength > 1){
						addStat(translate("$stats_mostCommonScore"),maxRunLengthScore, " " + translate("$stats_instances",maxRunLength))
					}
					else{
						addStat(translate("$stats_mostCommonScore"),"",translate("$stats_instances_unique"))
					}
				}
//longest activity
			}
			let singleText = translate("$stats_longestTime",[(100*longestDuration.time/sumDuration).roundPlaces(2),longestDuration.name]) + ". ";
			if(longestDuration.rewatch === 0){
				if(longestDuration.status === "CURRENT"){
					singleText += translate("$stats_longest_watching")
				}
				else if(longestDuration.status === "PAUSED"){
					singleText += translate("$stats_longest_paused")
				}
				else if(longestDuration.status === "DROPPED"){
					singleText += translate("$stats_longest_dropped")
				}
			}
			else{
				if(longestDuration.status === "COMPLETED"){
					if(longestDuration.rewatch === 1){
						singleText += translate("$stats_longest_1rewatch")
					}
					else if(longestDuration.rewatch === 2){
						singleText += translate("$stats_longest_2rewatch")
					}
					else{
						singleText += translate("$stats_longest_Mrewatch",longestDuration.rewatch)
					}
				}
				else if(longestDuration.status === "CURRENT" || status === "REPEATING"){
					if(longestDuration.rewatch === 1){
						singleText += translate("$stats_longest_1rewatching")
					}
					else if(longestDuration.rewatch === 2){
						singleText += translate("$stats_longest_2rewatching")
					}
					else{
						singleText += translate("$stats_longest_Mrewatching",longestDuration.rewatch)
					}
				}
				else if(longestDuration.status === "PAUSED"){
					if(longestDuration.rewatch === 1){
						singleText += translate("$stats_longest_1rewatchPaused")
					}
					else if(longestDuration.rewatch === 2){
						singleText += translate("$stats_longest_2rewatchPaused")
					}
					else{
						singleText += translate("$stats_longest_MrewatchPaused",longestDuration.rewatch)
					}
				}
				else if(longestDuration.status === "DROPPED"){
					if(longestDuration.rewatch === 1){
						singleText += translate("$stats_longest_1rewatchDropped")
					}
					else if(longestDuration.rewatch === 2){
						singleText += translate("$stats_longest_2rewatchDropped")
					}
					else{
						singleText += translate("$stats_longest_MrewatchDropped",longestDuration.rewatch)
					}
				}
			}
			addStat(
				translate("$stats_timeWatched"),
				(sumDuration/(60*24)).roundPlaces(2),
				" " + translate("$time_medium_Mday") + " (" + singleText + ")"
			)
			let TVepisodes = 0;
			let TVepisodesLeft = 0;
			list.filter(show => show.media.format === "TV").forEach(function(show){
				TVepisodes += show.progress;
				TVepisodes += show.repeat * Math.max(1,(show.media.episodes || 0),show.progress);
				if(show.status === "CURRENT"){
					TVepisodesLeft += Math.max((show.media.episodes || 0) - show.progress,0)
				}
			});
			addStat(translate("$stats_TVEpisodesWatched"),TVepisodes);
			addStat(translate("$stats_TVEpisodesRemaining"),TVepisodesLeft);
			if(oldest){
				create("p",false,translate("$stats_firstLoggedAnime") + [oldest.year, oldest.month, oldest.day].filter(TRUTHY).join("-") + ". " + translate("$stats_firstLoggedAnime_note"),personalStats)
			}
			let animeFormatter = {
				title: translate("$stats_customTagsAnime"),
				display: !useScripts.hideCustomTags,
				headings: [translate("$stats_tag"),translate("$stats_count"),translate("$stats_meanScore"),"Time Watched","Episodes","Eps remaining"],
				focus: -1,
				celData: [
					function(cel,data,index,isPrimary){
						if(isPrimary){
							let nameCellCount = create("div","count",(index+1),cel);
							let nameCellTag = create("a",false,data[index].name,cel,"cursor:pointer;");
							let nameCellStatus = create("span","hohSummableStatusContainer",false,cel);
							semmanticStatusOrder.forEach(function(status){
								if(data[index].status && data[index].status[status]){
									let statusSumDot = create("div","hohSummableStatus",data[index].status[status],nameCellStatus);
									statusSumDot.style.background = distributionColours[status];
									statusSumDot.title = data[index].status[status] + " " + capitalize(status.toLowerCase());
									if(data[index].status[status] > 99){
										statusSumDot.style.fontSize = "8px"
									}
									if(data[index].status[status] > 999){
										statusSumDot.style.fontSize = "6px"
									}
									statusSumDot.onclick = function(e){
										e.stopPropagation();
										Array.from(cel.parentNode.nextSibling.children).forEach(function(child){
											if(child.children[1].children[0].title === status.toLowerCase()){
												child.style.display = "grid"
											}
											else{
												child.style.display = "none"
											}
										})
									}
								}
							})
						}
						else{
							create("a","hohNameCel",data[index].name,cel)
								.href = "/anime/" + data[index].mediaId + "/" + safeURL(data[index].name)
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							cel.innerText = data[index].list.length
						}
						else{
							let statusDot = create("div","hohStatusDot",false,cel);
							statusDot.style.backgroundColor = distributionColours[data[index].status];
							statusDot.title = data[index].status.toLowerCase();
							if(data[index].status === "COMPLETED"){
								statusDot.style.backgroundColor = "transparent"//default case
							}
							if(data[index].repeat === 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true))
							}
							else if(data[index].repeat > 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true));
								create("span",false,data[index].repeat,cel)
							}
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							if(data[index].average === 0){
								cel.innerText = "-"
							}
							else{
								cel.innerText = (data[index].average).roundPlaces(1)
							}
						}
						else{
							if(data[index].score === 0){
								cel.innerText = "-"
							}
							else{
								cel.innerText = (data[index].score).roundPlaces(1)
							}
						}
					},
					function(cel,data,index){
						if(!data[index].duration){
							cel.innerText = "-"
						}
						else{
							cel.innerText = formatTime(data[index].duration*60,"short");
							cel.title = (data[index].duration/60).roundPlaces(1) + " " + translate("$time_medium_Mhour")
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							if(!data[index].list.length){
								cel.innerText = translate("$missing_N/A_data")
							}
							else{
								cel.innerText = data[index].episodes
							}
						}
						else{
							cel.innerText = data[index].episodes
						}
					},
					function(cel,data,index,isPrimary){
						if(data[index].episodes === 0 && data[index].remaining === 0 || isPrimary && !data[index].list.length){
							cel.innerText = translate("$missing_N/A_data")
						}
						else if(data[index].remaining === 0){
							cel.innerText = translate("$mediaStatus_completed")
						}
						else{
							if(useScripts.timeToCompleteColumn){
								cel.innerText = data[index].remaining + " (" + formatTime(data[index].remainingTime*60,"short") + ")"
							}
							else{
								cel.innerText = data[index].remaining
							}
						}
					}
				],
				sorting: [
					ALPHABETICAL(a => a.name),
					(b,a) => a.list.length - b.list.length,
					(b,a) => a.average - b.average,
					(b,a) => a.duration - b.duration,
					(b,a) => a.episodes - b.episodes,
					(b,a) => a.remaining - b.remaining
				]
			};
			const animeFields = [
				{
					key : "name",
					method : function(media){
						return titlePicker({
							id: media.mediaId,
							title: media.media.title
						})
					}
				},{
					key : "mediaId",
					method : media => media.mediaId
				},{
					key : "score",
					method : media => media.scoreRaw
				},{
					key : "repeat",
					method : media => media.repeat
				},{
					key : "status",
					sumable : function(acc,val){
						if(!acc){
							acc = {};
							Object.keys(distributionColours).forEach(function(key){
								acc[key] = 0
							})
						}
						acc[val]++;
						return acc
					},
					method : media => media.status
				},{
					key : "duration",
					sumable : ACCUMULATE,
					method : media => media.watchedDuration
				},{
					key : "episodes",
					sumable : ACCUMULATE,
					method : media => media.episodes
				},{
					key : "remaining",
					sumable : ACCUMULATE,
					method : function(media){
						return Math.max((media.media.episodes || 0) - media.progress,0)
					}
				},{
					key : "remainingTime",
					sumable : ACCUMULATE,
					method : function(media){
						return Math.max(((media.media.episodes || 0) - media.progress) * (media.media.duration || 1),0)
					}
				}
			];
			let customTags = customTagsCollection(list,animeFormatter.title,animeFields);
			if(customTags.length){
				let customTagsAnimeTable = create("div","#customTagsAnimeTable",false,personalStats);
				drawTable(customTags,animeFormatter,customTagsAnimeTable,{isTag: true,autoHide: true})
			}

			if(onlyStats){
				return
			}

			let listOfTags = regularTagsCollection(list,animeFields,media => media.media.tags);
			if(listOfTags.length > 50){
				listOfTags = listOfTags.filter(a => a.list.length >= 3)
			}
			semaPhoreAnime = list;
	if(script_type !== "Boneless"){
			drawTable(listOfTags,animeFormatter,regularAnimeTable,{isTag: true,autoHide: false});
			nativeTagsReplacer();
			const staffData = await anilistAPI(queryMediaListStaff, {
				variables: {name: user,listType: "ANIME"},
				cacheKey: "hohListCacheAnimeStaff" + user,
				duration: 15*60*1000
			})
			if(staffData.errors){
				return
			}
			let rawStaff = returnList(staffData);
			rawStaff.forEach((raw,index) => {
				raw.status = list[index].status;
				raw.watchedDuration = list[index].watchedDuration;
				raw.scoreRaw = list[index].scoreRaw
			});
			let staffMap = {};
			rawStaff.filter(obj => obj.status !== "PLANNING").forEach(media => {
				media.media.staff.forEach(staff => {
					if(!staffMap[staff.id]){
						staffMap[staff.id] = {
							watchedDuration: 0,
							count: 0,
							scoreCount: 0,
							scoreSum: 0,
							id: staff.id,
							name: staff.name
						}
					}
					if(media.watchedDuration){
						staffMap[staff.id].watchedDuration += media.watchedDuration;
						staffMap[staff.id].count++
					}
					if(media.scoreRaw){
						staffMap[staff.id].scoreSum += media.scoreRaw;
						staffMap[staff.id].scoreCount++
					}
				})
			});
			let staffList = [];
			Object.keys(staffMap).forEach(
				key => staffList.push(staffMap[key])
			);
			staffList = staffList.filter(
				obj => obj.count >= 1
			).sort(
				(b,a) => a.count - b.count || a.watchedDuration - b.watchedDuration
			);
			if(staffList.length > 300){
				staffList = staffList.filter(obj => obj.count >= 3)
			}
			if(staffList.length > 300){
				staffList = staffList.filter(obj => obj.count >= 5)
			}
			if(staffList.length > 300){
				staffList = staffList.filter(obj => obj.count >= 10)
			}
			let staffHasScores = staffList.some(a => a.scoreCount);
			let drawStaffList = function(){
				removeChildren(animeStaff)
				animeStaff.innerText = "";
				let table        = create("div",["table","hohTable","hohNoPointer"],false,animeStaff);
				let headerRow    = create("div",["header","row","good"],false,table);
				let nameHeading  = create("div",false,translate("$stats_name"),headerRow,"cursor:pointer;");
				let countHeading = create("div",false,translate("$stats_count"),headerRow,"cursor:pointer;");
				let scoreHeading = create("div",false,translate("$stats_meanScore"),headerRow,"cursor:pointer;");
				if(!staffHasScores){
					scoreHeading.style.display = "none"
				}
				let timeHeading = create("div",false,"Time Watched",headerRow,"cursor:pointer;");
				staffList.forEach(function(staff,index){
					let row = create("div",["row","good"],false,table);
					let nameCel = create("div",false,(index + 1) + " ",row);
					let staffLink = create("a",["link","newTab"],(staff.name.first + " " + (staff.name.last || "")).trim(),nameCel);
					staffLink.href = "/staff/" + staff.id;
					create("div",false,staff.count,row);
					if(staffHasScores){
						create("div",false,(staff.scoreSum/staff.scoreCount).roundPlaces(2),row);
					}
					let timeCel = create("div",false,formatTime(staff.watchedDuration*60),row);
					timeCel.title = (staff.watchedDuration/60).roundPlaces(1) + " hours";
				});
				let csvButton = create("button",["csvExport","button","hohButton"],"CSV data",animeStaff,"margin-top:10px;");
				let jsonButton = create("button",["jsonExport","button","hohButton"],"JSON data",animeStaff,"margin-top:10px;");
				csvButton.onclick = function(){
					let csvContent = 'Staff,Count,"Mean Score","Time Watched"\n';
					staffList.forEach(staff => {
						csvContent += csvEscape(
							[staff.name.first,staff.name.last].filter(TRUTHY).join(" ")
						) + ",";
						csvContent += staff.count + ",";
						csvContent += (staff.scoreSum/staff.scoreCount).roundPlaces(2) + ",";
						csvContent += (staff.watchedDuration/60).roundPlaces(1) + "\n"
					});
					saveAs(csvContent,"Anime staff stats for " + user + ".csv",true)
				};
				jsonButton.onclick = function(){
					saveAs({
						type: "ANIME",
						user: user,
						timeStamp: NOW(),
						version: "1.00",
						scriptInfo: scriptInfo,
						url: document.URL,
						description: "Anilist anime staff stats for " + user,
						fields: [
							{name: "name",   description: "The full name of the staff member, as firstname lastname"},
							{name: "staffID",description: "The staff member's database number in the Anilist database"},
							{name: "count",  description: "The total number of media this staff member has credits for, for the current user"},
							{name: "score",  description: "The current user's mean score for the staff member out of 100"},
							{name: "minutesWatched",description: "How many minutes of this staff member's credited media the current user has watched"}
						],
						data: staffList.map(staff => {
							return {
								name: (staff.name.first + " " + (staff.name.last || "")).trim(),
								staffID: staff.id,
								count: staff.count,
								score: (staff.scoreSum/staff.scoreCount).roundPlaces(2),
								minutesWatched: staff.watchedDuration
							}
						})
					},"Anime staff stats for " + user + ".json");
				}
				nameHeading.onclick = function(){
					staffList.sort(ALPHABETICAL(a => a.name.first + " " + (a.name.last || "")));
					drawStaffList()
				};
				countHeading.onclick = function(){
					staffList.sort((b,a) => a.count - b.count || a.watchedDuration - b.watchedDuration);
					drawStaffList()
				};
				scoreHeading.onclick = function(){
					staffList.sort((b,a) => a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount);
					drawStaffList()
				};
				timeHeading.onclick = function(){
					staffList.sort((b,a) => a.watchedDuration - b.watchedDuration);
					drawStaffList()
				}
			};
			let staffClickOnce = function(){
				drawStaffList();
				let place = document.querySelector(`[href$="/stats/anime/staff"]`);
				if(place){
					place.removeEventListener("click",staffClickOnce)
				}
			}
			let staffWaiter = function(){
				if(location.pathname.includes("/stats/anime/staff")){
					staffClickOnce();
					return
				}
				let place = document.querySelector(`[href$="/stats/anime/staff"]`);
				if(place){
					place.addEventListener("click",staffClickOnce)
				}
				else{
					setTimeout(staffWaiter,200)
				}
			};staffWaiter();


			let studioMap = {};
			list.forEach(function(anime){
				anime.media.studios.nodes.forEach(function(studio){
					if(!useScripts.allStudios && !studio.isAnimationStudio){
						return
					}
					if(!studioMap[studio.name]){
						studioMap[studio.name] = {
							watchedDuration: 0,
							count: 0,
							scoreCount: 0,
							scoreSum: 0,
							id: studio.id,
							isAnimationStudio: studio.isAnimationStudio,
							name: studio.name,
							media: []
						}
					}
					if(anime.watchedDuration){
						studioMap[studio.name].watchedDuration += anime.watchedDuration;
						studioMap[studio.name].count++
					}
					if(anime.scoreRaw){
						studioMap[studio.name].scoreSum += anime.scoreRaw;
						studioMap[studio.name].scoreCount++
					}
					let title = anime.media.title.romaji;
					if(anime.status !== "PLANNING"){
						if(useScripts.titleLanguage === "NATIVE" && anime.media.title.native){
							title = anime.media.title.native
						}
						else if(useScripts.titleLanguage === "ENGLISH" && anime.media.title.english){
							title = anime.media.title.english
						}
						studioMap[studio.name].media.push({
							watchedDuration: anime.watchedDuration,
							score: anime.scoreRaw,
							title: title,
							id: anime.mediaId,
							repeat: anime.repeat,
							status: anime.status
						})
					}
				})
			});
			let studioList = [];
			Object.keys(studioMap).forEach(
				key => studioList.push(studioMap[key])
			);
			studioList = studioList.filter(
				studio => studio.count >= 1
			).sort(
				(b,a) => a.count - b.count || a.watchedDuration - b.watchedDuration
			);
			studioList.forEach(
				studio => studio.media.sort((b,a) => a.score - b.score)
			);
			let studioHasScores = studioList.some(a => a.scoreCount);
			let drawStudioList = function(){
				removeChildren(animeStudios)
				animeStudios.innerText = "";
				let table = create("div",["table","hohTable"],false,animeStudios);
				let headerRow = create("div",["header","row","good"],false,table);
				let nameHeading = create("div",false,translate("$stats_name"),headerRow,"cursor:pointer;");
				let countHeading = create("div",false,translate("$stats_count"),headerRow,"cursor:pointer;");
				let scoreHeading = create("div",false,"Mean Score",headerRow,"cursor:pointer;");
				if(!studioHasScores){
					scoreHeading.style.display = "none"
				}
				let timeHeading = create("div",false,"Time Watched",headerRow,"cursor:pointer;");
				studioList.forEach(function(studio,index){
					let row = create("div",["row","good"],false,table);
					let nameCel = create("div",false,(index + 1) + " ",row);
					let studioLink = create("a",["link","newTab"],studio.name,nameCel);
					studioLink.href = "/studio/" + studio.id;
					if(!studio.isAnimationStudio){
						studioLink.style.color = "rgb(var(--color-green))"
					}
					let nameCellStatus = create("span","hohSummableStatusContainer",false,nameCel);
					semmanticStatusOrder.forEach(status => {
						let statCount = studio.media.filter(media => media.status === status).length;
						if(statCount){
							let statusSumDot = create("div","hohSummableStatus",statCount,nameCellStatus);
							statusSumDot.style.background = distributionColours[status];
							statusSumDot.title = statCount + " " + capitalize(status.toLowerCase());
							if(statCount > 99){
								statusSumDot.style.fontSize = "8px"
							}
							if(statCount > 999){
								statusSumDot.style.fontSize = "6px"
							}
							statusSumDot.onclick = function(e){
								e.stopPropagation();
								Array.from(nameCel.parentNode.nextSibling.children).forEach(function(child){
									if(child.children[1].children[0].title === status.toLowerCase()){
										child.style.display = "grid"
									}
									else{
										child.style.display = "none"
									}
								})
							}
						}
					});
					create("div",false,studio.count,row);
					if(studioHasScores){
						let scoreCel = create("div",false,(studio.scoreSum/studio.scoreCount).roundPlaces(2),row);
						scoreCel.title = studio.scoreCount + " ratings";
					}
					let timeString = formatTime(studio.watchedDuration*60);
					let timeCel = create("div",false,timeString,row);
					timeCel.title = (studio.watchedDuration/60).roundPlaces(1) + " hours";
					let showRow = create("div",false,false,table,"display:none;");
					studio.media.forEach(top => {
						let secondRow = create("div",["row","hohSecondaryRow","good"],false,showRow);
						let titleCel = create("div",false,false,secondRow,"margin-left:50px;");
						let titleLink = create("a","link",top.title,titleCel);
						titleLink.href = "/anime/" + top.id + "/" + safeURL(top.title);
						let countCel = create("div",false,false,secondRow);
						let statusDot = create("div","hohStatusDot",false,countCel);
						statusDot.style.backgroundColor = distributionColours[top.status];
						statusDot.title = top.status.toLowerCase();
						if(top.status === "COMPLETED"){
							statusDot.style.backgroundColor = "transparent";//default case
						}
						if(top.repeat === 1){
							countCel.appendChild(svgAssets2.repeat.cloneNode(true));
						}
						else if(top.repeat > 1){
							countCel.appendChild(svgAssets2.repeat.cloneNode(true));
							create("span",false,top.repeat,countCel)
						}
						create("div",false,(top.score ? top.score : "-"),secondRow);
						let timeString = formatTime(top.watchedDuration*60);
						let timeCel = create("div",false,timeString,secondRow);
						timeCel.title = (top.watchedDuration/60).roundPlaces(1) + " hours";
					});
					row.onclick = function(){
						if(showRow.style.display === "none"){
							showRow.style.display = "block"
						}
						else{
							showRow.style.display = "none"
						}
					}
				});
				let csvButton = create("button",["csvExport","button","hohButton"],"CSV data",animeStudios,"margin-top:10px;");
				let jsonButton = create("button",["jsonExport","button","hohButton"],"JSON data",animeStudios,"margin-top:10px;");
				csvButton.onclick = function(){
					let csvContent = 'Studio,Count,"Mean Score","Time Watched"\n';
					studioList.forEach(function(studio){
						csvContent += csvEscape(studio.name) + ",";
						csvContent += studio.count + ",";
						csvContent += (studio.scoreSum/studio.scoreCount).roundPlaces(2) + ",";
						csvContent += (studio.watchedDuration/60).roundPlaces(1) + "\n";
					});
					saveAs(csvContent,"Anime studio stats for " + user + ".csv",true);
				};
				jsonButton.onclick = function(){
					saveAs({
						type: "ANIME",
						user: user,
						timeStamp: NOW(),
						version: "1.00",
						scriptInfo: scriptInfo,
						url: document.URL,
						description: "Anilist anime studio stats for " + user,
						fields: [
							{name: "studio",description: "The name of the studio. (Can also be other companies, depending on the user's settings)"},
							{name: "studioID",description: "The studio's database number in the Anilist database"},
							{name: "count",description: "The total number of media this studio has credits for, for the current user"},
							{name: "score",description: "The current user's mean score for the studio out of 100"},
							{name: "minutesWatched",description: "How many minutes of this studio's credited media the current user has watched"},
							{
								name: "media",
								description: "A list of the media associated with this studio",
								subSelection: [
									{name: "title",description: "The title of the media (language depends on user settings)"},
									{name: "ID",description: "The media's database number in the Anilist database"},
									{name: "score",description: "The current user's mean score for the media out of 100"},
									{name: "minutesWatched",description: "How many minutes of the media the current user has watched"},
									{name: "status",description: "The current user's watching status for the media"},
								]
							}
						],
						data: studioList.map(studio => {
							return {
								studio: studio.name,
								studioID: studio.id,
								count: studio.count,
								score: (studio.scoreSum/studio.scoreCount).roundPlaces(2),
								minutesWatched: studio.watchedDuration,
								media: studio.media.map(media => {
									return {
										title: media.title,
										ID: media.id,
										score: media.score,
										minutesWatched: media.watchedDuration,
										status: media.status
									}
								})
							}
						})
					},"Anime studio stats for " + user + ".json");
				}
				nameHeading.onclick = function(){
					studioList.sort(ALPHABETICAL(a => a.name));
					studioList.forEach(studio => {
						studio.media.sort(ALPHABETICAL(a => a.title))
					});
					drawStudioList();
				};
				countHeading.onclick = function(){
					studioList.sort((b,a) => a.count - b.count || a.watchedDuration - b.watchedDuration);
					drawStudioList();
				};
				scoreHeading.onclick = function(){
					studioList.sort((b,a) => a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount);
					studioList.forEach(studio => {
						studio.media.sort((b,a) => a.score - b.score)
					});
					drawStudioList();
				};
				timeHeading.onclick = function(){
					studioList.sort((b,a) => a.watchedDuration - b.watchedDuration);
					studioList.forEach(function(studio){
						studio.media.sort((b,a) => a.watchedDuration - b.watchedDuration);
					});
					drawStudioList();
				};
			};
			let studioClickOnce = function(){
				drawStudioList();
				let place = document.querySelector(`[href$="/stats/anime/studios"]`);
				if(place){
					place.removeEventListener("click",studioClickOnce)
				}
			}
			let studioWaiter = function(){
				if(location.pathname.includes("/stats/anime/studios")){
					studioClickOnce();
					return;
				}
				let place = document.querySelector(`[href$="/stats/anime/studios"]`);
				if(place){
					place.addEventListener("click",studioClickOnce)
				}
				else{
					setTimeout(studioWaiter,200)
				}
			};studioWaiter();
	}//end boneless check
			return
		};
		if(user === whoAmI){
			const animeData = await anilistAPI(cache.listQuery.ANIME, {
				variables: {name: user},
				cacheKey: "ListCacheANIME" + user,
				duration: 60*60*1000,
				auth: true
			});
			if(animeData.errors){
				return
			}
			personalStatsCallback(animeData)
		}
		else{
			const animeData = await anilistAPI(queryMediaListAnime, {
				variables: {name: user, listType: "ANIME"}
			})
			if(animeData.errors){
				return
			}
			personalStatsCallback(animeData)
		}
//manga stats
		let personalStatsMangaCallback = async function(data){
			personalStatsManga.innerText = "";
			create("hr","hohSeparator",false,personalStatsManga);
			create("h1","hohStatHeading",translate("$stats_manga_heading",user),personalStatsManga);
			let list = returnList(data);
			let scoreList = list.filter(element => element.scoreRaw);
			let personalStatsMangaContainer = create("div",false,false,personalStatsManga);
			if(whoAmI && whoAmI !== user){
				let compatabilityButton = create("button",["button","hohButton"],"Compatibility",personalStatsManga);
				let compatLocation = create("div","#hohCheckCompatManga",false,personalStatsManga);
				compatabilityButton.onclick = function(){
					compatLocation.innerText = translate("$loading");
					compatLocation.style.marginTop = "5px";
					compatCheck(
						scoreList,
						whoAmI,
						"MANGA",
						function(data){
							formatCompat(data,compatLocation,user)
						}
					)
				}
			}
			let addStat = function(text,value,comment){//value,value,html
				let newStat = create("p","hohStat",false,personalStatsManga);
				create("span",false,text,newStat);
				create("span","hohStatValue",value,newStat);
				if(comment){
					let newStatComment = create("span",false,false,newStat);
					newStatComment.innerText = comment
				}
			};
			let chapters = 0;
			let volumes = 0;
			/*
			For most airing anime, Anilist provides "media.nextAiringEpisode.episode"
			Unfortunately, the same is not the case for releasing manga.
			THIS DOESN'T MATTER the first time a user is reading something, as we are then just using the current progress.
			But on a re-read, we need the total length to count all the chapters read.
			I can (and do) get a lower bound for this by using the current progress (this is what Anilist does),
			but this is not quite accurate, especially early in a re-read.
			The list below is to catch some of those exceptions
			*/
			let unfinishedLookup = function(mediaId,mode,mediaStatus,mediaProgress){//wow, this is a mess. But it works
				if(mediaStatus === "FINISHED"){
					return 0//it may have finished since the list was updated
				}
				if(hasOwn(commonUnfinishedManga, mediaId)){
					if(mode === "chapters"){
						return commonUnfinishedManga[mediaId].chapters
					}
					else if(mode === "volumes"){
						return commonUnfinishedManga[mediaId].volumes
					}
					else if(mode === "volumesNow"){
						if(commonUnfinishedManga[mediaId].chapters <= (mediaProgress || 0)){
							return commonUnfinishedManga[mediaId].volumes
						}
						else{
							//if much behind, assume volumes scale linearly
							return Math.floor(commonUnfinishedManga[mediaId].volumes * mediaProgress/commonUnfinishedManga[mediaId].chapters)
						}
					}
					return 0;//fallback
				}
				else{
					return 0//not in our list
				}
			};
			list.forEach(function(item){
				let chaptersRead = 0;
				let volumesRead = 0;
				if(item.status === "COMPLETED"){//if it's completed, we can make some safe assumptions
					chaptersRead += Math.max(//chapter progress on the current read
						item.media.chapters,//in most cases, it has a chapter count
						item.media.volumes,//if not, there's at least 1 chapter per volume
						item.progress,//if it doesn't have a volume count either, the current progress is probably not out of date
						item.progressVolumes,//if it doesn't have a chapter progress, count at least 1 chapter per volume
						1//finally, an entry has at least 1 chapter
					);
					volumesRead += Math.max(
						item.progressVolumes,
						item.media.volumes,
						unfinishedLookup(item.mediaId+"","volumesNow",item.media.status,item.progress)//if people have forgotten to update their volume count and have caught up.
					)
				}
				else{//we may only assume what's on the user's list.
					chaptersRead += Math.max(
						item.progress,
						item.progressVolumes
					);
					volumesRead += Math.max(
						item.progressVolumes,
						unfinishedLookup(item.mediaId+"","volumesNow",item.media.status,item.progress)
					)
				}
				if(useScripts.noRewatches && item.repeat){//if they have a reread, they have at least completed it
					chaptersRead = Math.max(//first round
						item.media.chapters,
						item.media.volumes,
						item.progress,
						item.progressVolumes,
						unfinishedLookup(item.mediaId+"","chapters",item.media.status),//use our lookup table
						1
					);
					volumesRead = Math.max(
						item.media.volumes,
						item.progressVolumes,
						unfinishedLookup(item.mediaId+"","volumes",item.media.status)
					)
				}
				else{
					chaptersRead += item.repeat * Math.max(//chapters from rereads
						item.media.chapters,
						item.media.volumes,
						item.progress,
						item.progressVolumes,
						unfinishedLookup(item.mediaId+"","chapters",item.media.status),//use our lookup table
						1
					);
					volumesRead += item.repeat * Math.max(//many manga have no volumes, so we can't make all of the same assumptions
						item.media.volumes,
						item.progressVolumes,//better than nothing if a volume count is missing
						unfinishedLookup(item.mediaId+"","volumes",item.media.status)
					)
				}
				if(item.listJSON && item.listJSON.adjustValue){
					chaptersRead = Math.max(0,chaptersRead + item.listJSON.adjustValue)
				}
				chapters += chaptersRead;
				volumes += volumesRead;
				item.volumesRead = volumesRead;
				item.chaptersRead = chaptersRead;
			});
//
			let previouScore = 0;
			let maxRunLength = 0;
			let maxRunLengthScore = 0;
			let runLength = 0;
			let sumEntries = 0;
			let average = 0;
			let publicDeviation = 0;
			let publicDifference = 0;
			let histogram = new Array(100).fill(0);
			let amount = scoreList.length;
			let median = (scoreList.length ? Stats.median(scoreList.map(e => e.scoreRaw)) : 0);
			let sumWeight = 0;
			let sumEntriesWeight = 0;

			scoreList.sort((a,b) => a.scoreRaw - b.scoreRaw);
			scoreList.forEach(function(item){
				sumEntries += item.scoreRaw;
				if(item.scoreRaw === previouScore){
					runLength++;
					if(runLength > maxRunLength){
						maxRunLength = runLength;
						maxRunLengthScore = item.scoreRaw
					}
				}
				else{	
					runLength = 1;
					previouScore = item.scoreRaw
				}
				sumWeight += item.chaptersRead;
				sumEntriesWeight += item.scoreRaw * item.chaptersRead;
				histogram[item.scoreRaw - 1]++
			});
			addStat(translate("$stats_mangaOnList"),list.length);
			addStat(translate("$stats_mangaRated"),amount);
			addStat(translate("$stats_totalChapters"),chapters);
			addStat(translate("$stats_totalVolumes"),volumes);
			if(amount){
				average = sumEntries/amount
			}
			if(scoreList.length){
				publicDeviation = Math.sqrt(
					scoreList.reduce(function(accum,element){
						if(!element.media.meanScore){
							return accum
						}
						return accum + Math.pow(element.media.meanScore - element.scoreRaw,2);
					},0)/amount
				);
				publicDifference = scoreList.reduce(function(accum,element){
					if(!element.media.meanScore){
						return accum
					}
					return accum + (element.scoreRaw - element.media.meanScore);
				},0)/amount
			}
			list.sort((a,b) => a.mediaId - b.mediaId);
			if(amount){//no scores
				if(amount === 1){
					addStat(
						translate("$stats_onlyOne"),
						maxRunLengthScore
					)
				}
				else{
					addStat(
						translate("$stats_averageScore"),
						average.toPrecision(4)
					);
					addStat(
						translate("$stats_averageScore"),
						(sumEntriesWeight/sumWeight).toPrecision(4),
						translate("$stats_weightComment_chapers")
					);
					addStat(translate("$stats_medianScore"),median);
					addStat(
						translate("$stats_globalDifference"),
						publicDifference.roundPlaces(2),
						translate("$stats_globalDifference_comment")
					);
					addStat(
						translate("$stats_globalDeviation"),
						publicDeviation.roundPlaces(2),
						translate("$stats_globalDeviation_comment")
					);
					addStat(
						translate("$stats_ratingEntropy"),
						-histogram.reduce((acc,val) => {
							if(val){
								return acc + Math.log2(val/amount) * val/amount
							}
							return acc
						},0).toPrecision(3),
						translate("$stats_ratingEntropy_comment")
					);
					if(maxRunLength > 1){
						addStat(translate("$stats_mostCommonScore"),maxRunLengthScore, " " + translate("$stats_instances",maxRunLength))
					}
					else{
						addStat(translate("$stats_mostCommonScore"),"","no two scores alike")
					}
				}
			}
//
			let mangaFormatter = {
				title: translate("$stats_customTagsManga"),
				display: !useScripts.hideCustomTags,
				headings: [translate("$stats_tag"),translate("$stats_count"),translate("$stats_meanScore"),translate("$stats_chapters"),translate("$stats_volumes")],
				focus: -1,
				celData: [
					function(cel,data,index,isPrimary){
						if(isPrimary){
							let nameCellCount = create("div","count",(index+1),cel);
							create("a",false,data[index].name,cel,"cursor:pointer;");
							let nameCellStatus = create("span","hohSummableStatusContainer",false,cel);
							semmanticStatusOrder.forEach(function(status){
								if(data[index].status && data[index].status[status]){
									let statusSumDot = create("div","hohSummableStatus",data[index].status[status],nameCellStatus);
									statusSumDot.style.background = distributionColours[status];
									statusSumDot.title = data[index].status[status] + " " + capitalize(statusTypes[status]);
									if(data[index].status[status] > 99){
										statusSumDot.style.fontSize = "8px"
									}
									if(data[index].status[status] > 999){
										statusSumDot.style.fontSize = "6px"
									}
									statusSumDot.onclick = function(e){
										e.stopPropagation();
										Array.from(cel.parentNode.nextSibling.children).forEach(function(child){
											if(child.children[1].children[0].title === status.toLowerCase()){
												child.style.display = "grid"
											}
											else{
												child.style.display = "none"
											}
										})
									}
								}
							})
						}
						else{
							create("a","hohNameCel",data[index].name,cel)
								.href = "/manga/" + data[index].mediaId + "/" + safeURL(data[index].name)
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							cel.innerText = data[index].list.length
						}
						else{
							let statusDot = create("div","hohStatusDot",false,cel);
							statusDot.style.backgroundColor = distributionColours[data[index].status];
							statusDot.title = data[index].status.toLowerCase();
							if(data[index].status === "COMPLETED"){
								statusDot.style.backgroundColor = "transparent"//default case
							}
							if(data[index].repeat === 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true));
							}
							else if(data[index].repeat > 1){
								cel.appendChild(svgAssets2.repeat.cloneNode(true));
								create("span",false,data[index].repeat,cel)
							}
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary){
							if(data[index].average === 0){
								cel.innerText = "-"
							}
							else{
								cel.innerText = (data[index].average).roundPlaces(1)
							}
						}
						else{
							if(data[index].score === 0){
								cel.innerText = "-"
							}
							else{
								cel.innerText = (data[index].score).roundPlaces(1)
							}
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary && !data[index].list.length){
							cel.innerText = "-"
						}
						else{
							cel.innerText = data[index].chaptersRead
						}
					},
					function(cel,data,index,isPrimary){
						if(isPrimary && !data[index].list.length){
							cel.innerText = "-"
						}
						else{
							cel.innerText = data[index].volumesRead
						}
					}
				],
				sorting: [
					ALPHABETICAL(a => a.name),
					(b,a) => a.list.length - b.list.length,
					(b,a) => a.average - b.average,
					(b,a) => a.chaptersRead - b.chaptersRead,
					(b,a) => a.volumesRead - b.volumesRead
				]
			};
			const mangaFields = [
				{
					key : "name",
					method : function(media){
						return titlePicker({
							id: media.mediaId,
							title: media.media.title
						})
					}
				},{
					key : "repeat",
					method : media => media.repeat
				},{
					key : "status",
					sumable : function(acc,val){
						if(!acc){
							acc = {};
							Object.keys(distributionColours).forEach(function(key){
								acc[key] = 0
							})
						}
						acc[val]++;
						return acc
					},
					method : media => media.status
				},{
					key : "mediaId",
					method : media => media.mediaId
				},{
					key : "score",
					method : media => media.scoreRaw
				},{
					key : "chaptersRead",
					sumable : ACCUMULATE,
					method : media => media.chaptersRead
				},{
					key : "volumesRead",
					sumable : ACCUMULATE,
					method : media => media.volumesRead
				}
			];
			let customTags = customTagsCollection(list,mangaFormatter.title,mangaFields);
			if(customTags.length){
				let customTagsMangaTable = create("div","#customTagsMangaTable",false,personalStatsManga);
				drawTable(customTags,mangaFormatter,customTagsMangaTable,{isTag: true,autoHide: true})
			}
			let listOfTags = regularTagsCollection(list,mangaFields,media => media.media.tags);
			if(listOfTags.length > 50){
				listOfTags = listOfTags.filter(a => a.list.length >= 3)
			}
			semaPhoreManga = list;
	if(script_type !== "Boneless"){
			drawTable(listOfTags,mangaFormatter,regularMangaTable,{isTag: true,autoHide: false});
			nativeTagsReplacer();
	}

			const staffSimpleData = await anilistAPI(queryMediaListStaff_simple, {
				variables: {name: user,listType: "MANGA"},
				cacheKey: "hohListCacheMangaStaff" + user,
				duration: 10*60*1000
			})
			if(staffSimpleData.errors){
				return
			}
			let rawStaff = returnList(staffSimpleData);
			let cacheOffset = 0;
			rawStaff.forEach(function(raw,index){
				if(raw.mediaId === list[index - cacheOffset].mediaId){
					raw.status = list[index - cacheOffset].status;
					raw.chaptersRead = list[index - cacheOffset].chaptersRead;
					raw.volumesRead = list[index - cacheOffset].volumesRead;
					raw.scoreRaw = list[index - cacheOffset].scoreRaw
				}
				else{
					cacheOffset++;
					raw.status = "CURRENT";
					raw.chaptersRead = 0;
					raw.volumesRead = 0;
					raw.scoreRaw = 0
				}
			});
			let staffMap = {};
			rawStaff.filter(obj => obj.status !== "PLANNING").forEach(function(media){
				media.media.staff.edges.forEach(function(staff){
					if(!staffMap[staff.node.id]){
						staffMap[staff.node.id] = {
							chaptersRead: 0,
							volumesRead: 0,
							count: 0,
							scoreCount: 0,
							scoreSum: 0,
							id: staff.node.id,
							name: staff.node.name,
							roles: [],
							ownChaptersRead: 0,
							ownVolumesRead: 0,
							ownCount: 0,
							ownScoreCount: 0,
							ownScoreSum: 0,
						}
					}
					staffMap[staff.node.id].roles.push(staff.role);
					if(media.chaptersRead || media.volumesRead){
						staffMap[staff.node.id].volumesRead += media.volumesRead;
						staffMap[staff.node.id].chaptersRead += media.chaptersRead;
						staffMap[staff.node.id].count++
					}
					if(media.scoreRaw){
						staffMap[staff.node.id].scoreSum += media.scoreRaw;
						staffMap[staff.node.id].scoreCount++
					}
					if(!staff.role.toLowerCase().match(/assist(a|e)nt|storyboard|assistance/i)){
						if(media.chaptersRead || media.volumesRead){
							staffMap[staff.node.id].ownVolumesRead += media.volumesRead;
							staffMap[staff.node.id].ownChaptersRead += media.chaptersRead;
							staffMap[staff.node.id].ownCount++
						}
						if(media.scoreRaw){
							staffMap[staff.node.id].ownScoreSum += media.scoreRaw;
							staffMap[staff.node.id].ownScoreCount++
						}
					}
				})
			});
			let staffList = [];
			Object.keys(staffMap).forEach(
				key => staffList.push(staffMap[key])
			);
			staffList = staffList.filter(obj => obj.count >= 1).sort(
				(b,a) => a.count - b.count || a.chaptersRead - b.chaptersRead || a.volumesRead - b.volumesRead
			);
			if(staffList.length > 300){
				staffList = staffList.filter(
					obj => obj.count >= 3
					|| (obj.count >= 2 && obj.chaptersRead >= 100)
					|| obj.chaptersRead >= 200
					|| obj.volumesRead >= 10
				)
			}
			if(staffList.length > 300){
				staffList = staffList.filter(
					obj => obj.count >= 5
					|| (obj.count >= 2 && obj.chaptersRead >= 200)
					|| obj.chaptersRead >= 300
					|| obj.volumesRead >= 15
				)
			}
			if(staffList.length > 300){
				staffList = staffList.filter(
					obj => obj.count >= 10
					|| (obj.count >= 2 && obj.chaptersRead >= 300)
					|| obj.chaptersRead >= 400
					|| obj.volumesRead >= 25
				)
			}
			let hasScores = staffList.some(a => a.scoreCount);
			let story_filter;
			let art_filter;
			let assistant_filter;
			let translator_filter;
			let drawStaffList = function(){
				if(mangaStaff.querySelector(".table")){
					mangaStaff.querySelector(".table").remove()
				}
				if(mangaStaff.querySelector(".jsonExport")){
					mangaStaff.querySelector(".jsonExport").remove();
					mangaStaff.querySelector(".csvExport").remove()
				}
				else{
					mangaStaff.innerText = "";
					story_filter = createCheckbox(mangaStaff);
					create("span",false,translate("$role_Story",null,"Story"),mangaStaff,"margin-right:5px;");
					art_filter = createCheckbox(mangaStaff);
					create("span",false,translate("$role_Art",null,"Art"),mangaStaff,"margin-right:5px;");
					assistant_filter = createCheckbox(mangaStaff);
					create("span",false,"Assistants",mangaStaff,"margin-right:5px;");
					translator_filter = createCheckbox(mangaStaff);
					create("span",false,"Translators",mangaStaff,"margin-right:5px;");
					story_filter.checked = true;
					art_filter.checked = true;
					assistant_filter.checked = true;
					translator_filter.checked = true;
					story_filter.oninput = drawStaffList;
					art_filter.oninput = drawStaffList;
					assistant_filter.oninput = drawStaffList;
					translator_filter.oninput = drawStaffList;
				}
				let table = create("div",["table","hohTable","hohNoPointer"],false,mangaStaff);
				let headerRow = create("div",["header","row","good"],false,table);
				let nameHeading = create("div",false,translate("$stats_name"),headerRow,"cursor:pointer;");
				let countHeading = create("div",false,translate("$stats_count"),headerRow,"cursor:pointer;");
				let scoreHeading = create("div",false,translate("$stats_meanScore"),headerRow,"cursor:pointer;");
				if(!hasScores){
					scoreHeading.style.display = "none"
				}
				let timeHeading = create("div",false,"Chapters Read",headerRow,"cursor:pointer;");
				let volumeHeading = create("div",false,"Volumes Read",headerRow,"cursor:pointer;");
				staffList.forEach(function(staff,index){
					if(
						(!story_filter.checked && art_filter.checked && staff.roles.every(role => role.toLowerCase().match(/story/) && !role.toLowerCase().match(/art/)))
						|| (story_filter.checked && !art_filter.checked && staff.roles.every(role => role.toLowerCase().match(/art/) && !role.toLowerCase().match(/story/)))
						|| (
							!story_filter.checked
							&& !art_filter.checked
							&& (
								staff.roles.every(role => role.toLowerCase().match(/art|story/))
								|| !staff.roles.some(role => role.toLowerCase().match(/translator|storyboard|translation|lettering|touch-up|assist(a|e)nt|assistance/i))
							)
						)
						|| (!assistant_filter.checked && staff.roles.every(role => role.toLowerCase().match(/assist(a|e)nt|storyboard|assistance/i)))
						|| (!translator_filter.checked && staff.roles.some(role => role.toLowerCase().match(/translator|translation|lettering|touch-up/i)))
					){
						return
					}
					let row = create("div",["row","good"],false,table);
					let nameCel = create("div",false,(index + 1) + " ",row);
					create("a","newTab",staff.name.first + " " + (staff.name.last || ""),nameCel)
						.href = "/staff/" + staff.id;
					create("div",false,staff.count,row);
					if(assistant_filter.checked){
						if(hasScores){
							create("div",false,(staff.scoreSum/staff.scoreCount).roundPlaces(2),row)
						}
						create("div",false,staff.chaptersRead,row);
						create("div",false,staff.volumesRead,row)
					}
					else{
						if(hasScores){
							create("div",false,(staff.ownScoreSum/staff.ownScoreCount).roundPlaces(2),row)
						}
						create("div",false,staff.ownChaptersRead,row);
						create("div",false,staff.ownVolumesRead,row)
					}
				});
				let csvButton = create("button",["csvExport","button","hohButton"],"CSV data",mangaStaff,"margin-top:10px;");
				let jsonButton = create("button",["jsonExport","button","hohButton"],"JSON data",mangaStaff,"margin-top:10px;");
				csvButton.onclick = function(){
					let csvContent = 'Staff,Count,"Mean Score","Chapters Read","Volumes Read"\n';
					staffList.forEach(staff => {
						csvContent += csvEscape(
							[staff.name.first,staff.name.last].filter(TRUTHY).join(" ")
						) + ",";
						csvContent += staff.count + ",";
						csvContent += (staff.scoreSum/staff.scoreCount).roundPlaces(2) + ",";
						csvContent += staff.chaptersRead + ",";
						csvContent += staff.volumesRead + "\n";
					});
					saveAs(csvContent,"Manga staff stats for " + user + ".csv",true)
				};
				jsonButton.onclick = function(){
					saveAs({
						type: "MANGA",
						user: user,
						timeStamp: NOW(),
						version: "1.00",
						scriptInfo: scriptInfo,
						url: document.URL,
						description: "Anilist manga staff stats for " + user,
						fields: [
							{name: "name",description: "The full name of the staff member, as firstname lastname"},
							{name: "staffID",description: "The staff member's database number in the Anilist database"},
							{name: "count",description: "The total number of media this staff member has credits for, for the current user"},
							{name: "score",description: "The current user's mean score for the staff member out of 100"},
							{name: "chaptersRead",description: "How many chapters of this staff member's credited media the current user has read"},
							{name: "volumesRead",description: "How many volumes of this staff member's credited media the current user has read"}
						],
						data: staffList.map(staff => {
							return {
								name: (staff.name.first + " " + (staff.name.last || "")).trim(),
								staffID: staff.id,
								count: staff.count,
								score: (staff.scoreSum/staff.scoreCount).roundPlaces(2),
								chaptersRead: staff.chaptersRead,
								volumesRead: staff.volumesRead
							}
						})
					},"Manga staff stats for " + user + ".json")
				}
				nameHeading.onclick = function(){
					staffList.sort(ALPHABETICAL(a => a.name.first + " " + (a.name.last || "")));
					drawStaffList()
				};
				countHeading.onclick = function(){
					if(assistant_filter.checked){
						staffList.sort(
							(b,a) => a.count - b.count
								|| a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
								|| a.ownCount - b.ownCount
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
						)
					}
					else{
						staffList.sort(
							(b,a) => a.ownCount - b.ownCount
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
								|| a.count - b.count
								|| a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
						)
					}
					drawStaffList()
				};
				scoreHeading.onclick = function(){
					if(assistant_filter.checked){
						staffList.sort(
							(b,a) => a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
								|| a.count - b.count
								|| a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
								|| a.ownCount - b.ownCount
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
						)
					}
					else{
						staffList.sort(
							(b,a) => a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
								|| a.ownCount - b.ownCount
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
								|| a.count - b.count
								|| a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
						)
					}
					drawStaffList()
				};
				timeHeading.onclick = function(){
					if(assistant_filter.checked){
						staffList.sort(
							(b,a) => a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
								|| a.count - b.count
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.ownCount - b.ownCount
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
						)
					}
					else{
						staffList.sort(
							(b,a) => a.ownChaptersRead - b.ownChaptersRead
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.ownCount - b.ownCount
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
								|| a.chaptersRead - b.chaptersRead
								|| a.volumesRead - b.volumesRead
								|| a.count - b.count
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
						)
					}
					drawStaffList()
				};
				volumeHeading.onclick = function(){
					if(assistant_filter.checked){
						staffList.sort(
							(b,a) => a.volumesRead - b.volumesRead
								|| a.chaptersRead - b.chaptersRead
								|| a.count - b.count
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
								|| a.ownVolumesRead - b.ownVolumesRead
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownCount - b.ownCount
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
						)
					}
					else{
						staffList.sort(
							(b,a) => a.ownVolumesRead - b.ownVolumesRead
								|| a.ownChaptersRead - b.ownChaptersRead
								|| a.ownCount - b.ownCount
								|| a.ownScoreSum/a.ownScoreCount - b.ownScoreSum/b.ownScoreCount
								|| a.volumesRead - b.volumesRead
								|| a.chaptersRead - b.chaptersRead
								|| a.count - b.count
								|| a.scoreSum/a.scoreCount - b.scoreSum/b.scoreCount
						)
					}
					drawStaffList()
				}
			};
			let clickOnce = function(){
				drawStaffList();
				let place = document.querySelector(`[href$="/stats/manga/staff"]`);
				if(place){
					place.removeEventListener("click",clickOnce)
				}
			}
			let waiter = function(){
				if(location.pathname.includes("/stats/manga/staff")){
					clickOnce();
					return
				}
				let place = document.querySelector(`[href$="/stats/manga/staff"]`);
				if(place){
					place.addEventListener("click",clickOnce)
				}
				else{
					setTimeout(waiter,200)
				}
			};waiter();
			return
		};
		if(user === whoAmI){
			const mangaData = await anilistAPI(cache.listQuery.MANGA, {
				variables: {name: user},
				cacheKey: "ListCacheMANGA" + user,
				duration: 60*60*1000,
				auth: true
			});
			if(mangaData.errors){
				return
			}
			personalStatsMangaCallback(mangaData)
		}
		else{
			const mangaData = await anilistAPI(queryMediaListManga, {
				variables: {name: user, listType: "MANGA"}
			})
			if(mangaData.errors){
				return
			}
			personalStatsMangaCallback(mangaData)
		}
		return
	};
	let tabWaiter = function(){
		let tabMenu = filterGroup.querySelectorAll(".filter-group > a");
		tabMenu.forEach(tab => {
			tab.onclick = function(){
				Array.from(document.querySelector(".stats-wrap").children).forEach(child => {
					child.style.display = "initial";
				});
				Array.from(document.getElementsByClassName("hohActive")).forEach(child => {
					child.classList.remove("hohActive");
				});
				document.getElementById("hohStats").style.display = "none";
				document.getElementById("hohGenres").style.display = "none";
				document.querySelector(".page-content .user").classList.remove("hohSpecialPage")
			}
		});
		if(!tabMenu.length){
			setTimeout(tabWaiter,200)
		}
	};tabWaiter();
	let statsWrap = document.querySelector(".stats-wrap");
	if(statsWrap){
		hohStats = create("div","#hohStats",false,statsWrap,"display:none;");
		hohGenres = create("div","#hohGenres",false,statsWrap,"display:none;");
		regularFilterHeading = create("div","#regularFilterHeading",false,hohGenres);
		regularGenresTable = create("div","#regularGenresTable",translate("$loading"),hohGenres);
		if(script_type !== "Boneless"){
			regularTagsTable = create("div","#regularTagsTable",translate("$loading"),hohGenres);
			regularAnimeTable = create("div","#regularAnimeTable",translate("$loading"),statsWrap);
			regularMangaTable = create("div","#regularMangaTable",translate("$loading"),statsWrap);
			animeStaff = create("div","#animeStaff",translate("$loading"),statsWrap);
			mangaStaff = create("div","#mangaStaff",translate("$loading"),statsWrap);
			animeStudios = create("div","#animeStudios",translate("$loading"),statsWrap);
		}
		hohStats.calculated = false;
		generateStatPage()
	}
	hohStatsTrigger.onclick = function(){
		hohStatsTrigger.classList.add("hohActive");
		hohGenresTrigger.classList.remove("hohActive");
		document.querySelector(".page-content .user").classList.add("hohSpecialPage");
		let otherActive = filterGroup.querySelector(".router-link-active");
		if(otherActive){
			otherActive.classList.remove("router-link-active");
			otherActive.classList.remove("router-link-exact-active");
		}
		document.querySelectorAll(".stats-wrap > div").forEach(
			module => module.style.display = "none"
		);
		hohStats.style.display = "initial";
		hohGenres.style.display = "none"
	};
	hohGenresTrigger.onclick = function(){
		hohStatsTrigger.classList.remove("hohActive");
		hohGenresTrigger.classList.add("hohActive");
		document.querySelector(".page-content .user").classList.add("hohSpecialPage");
		let otherActive = filterGroup.querySelector(".router-link-active");
		if(otherActive){
			otherActive.classList.remove("router-link-active");
			otherActive.classList.remove("router-link-exact-active")
		}
		document.querySelectorAll(".stats-wrap > div").forEach(
			module => module.style.display = "none"
		);
		hohStats.style.display = "none";
		hohGenres.style.display = "initial"
	}
}
//end modules/addMoreStats.js
//begin modules/addMyThreadsLink.js
function addMyThreadsLink(){
	if(!document.URL.match(/^https:\/\/anilist\.co\/forum\/?(overview|search\?.*|recent|new|subscribed)?$/)){
		return
	}
	if(document.querySelector(".hohMyThreads")){
		return
	}
	let target = document.querySelector(".filters");
	if(!target){
		setTimeout(addMyThreadsLink,100)
	}
	else{
		create("a",["hohMyThreads","link"],translate("$myThreads_link"),target)
			.href = "https://anilist.co/user/" + whoAmI + "/social#my-threads"
	}
}
//end modules/addMyThreadsLink.js
//begin modules/addProgressBar.js
function addProgressBar(){
	if(location.pathname !== "/home"){
		return
	}
	let mediaCards = document.querySelectorAll(".media-preview-card .content .info:not(.hasMeter) > div");
	if(!mediaCards.length){
		setTimeout(function(){
			addProgressBar()
		},200);//may take some time to load
		return
	}
	mediaCards.forEach(card => {
		const progressInformation = card.innerText.match(/Progress: (\d+)\/(\d+)/);
		if(progressInformation){
			let pBar = create("meter");
			pBar.value = progressInformation[1];
			pBar.min = 0;
			pBar.max = progressInformation[2];
			card.parentNode.insertBefore(pBar,card);
			card.parentNode.parentNode.parentNode.querySelector(".plus-progress").onclick = function(){
				pBar.value++;
				setTimeout(function(){
					pBar.value = card.innerText.match(/Progress: (\d+)\/(\d+)/)[1]
				},1000)
			}
		}
	});
	if(document.querySelector(".size-toggle")){
		document.querySelector(".size-toggle").onclick = function(){
			setTimeout(function(){
				addProgressBar()
			},200);
		}
	}
}
//end modules/addProgressBar.js
//begin modules/addRelationStatusDot.js
function addRelationStatusDot(id){
	if(!location.pathname.match(/^\/(anime|manga)/)){
		return;
	}
	let relations = document.querySelector(".relations");
	if(relations){
		if(relations.classList.contains("hohRelationStatusDots")){
			return
		}
		relations.classList.add("hohRelationStatusDots");
	}
	authAPIcall(
`query($id: Int){
	Media(id:$id){
		relations{
			nodes{
				id
				type
				mediaListEntry{status}
			}
		}
		recommendations(sort:RATING_DESC){
			nodes{
				mediaRecommendation{
					id
					type
					mediaListEntry{status}
				}
			}
		}
	}
}`,
		{id: id},
		function(data){
			if(!data){
				return
			}
			let adder = function(){
				let mangaAnimeMatch = document.URL.match(/^https:\/\/anilist\.co\/(anime|manga)\/(\d+)\/?([^/]*)?\/?(.*)?/);
				if(!mangaAnimeMatch){
					return
				}
				if(mangaAnimeMatch[2] !== id){
					return
				}
				let rels = data.data.Media.relations.nodes.filter(media => media.mediaListEntry);
				if(rels){
					relations = document.querySelector(".relations");
					if(relations){
						relations.classList.add("hohRelationStatusDots");
						relations.querySelectorAll(".hohStatusDot").forEach(dot => dot.remove());
						rels.forEach(media => {
							let target = relations.querySelector("[href^=\"/" + media.type.toLowerCase() + "/" + media.id + "/\"]");
							if(target){
								let statusDot = create("div","hohStatusDot",false,target);
								statusDot.style.background = distributionColours[media.mediaListEntry.status];
								statusDot.title = media.mediaListEntry.status.toLowerCase();
							}
						})
					}
					else{
						setTimeout(adder,300);
					}
				}
			};adder();
			let recsAdder = function(){
				let mangaAnimeMatch = document.URL.match(/^https:\/\/anilist\.co\/(anime|manga)\/(\d+)\/?([^/]*)?\/?(.*)?/);
				if(!mangaAnimeMatch){
					return
				}
				if(mangaAnimeMatch[2] !== id){
					return
				}
				let recs = data.data.Media.recommendations.nodes.map(
					item => item.mediaRecommendation
				).filter(
					item => item.mediaListEntry
				);
				if(recs.length){
					let findCard = document.querySelector(".recommendation-card");
					if(findCard){
						findCard = findCard.parentNode;
						let adder = function(recs){
							recs.forEach(media => {
								let target = findCard.querySelector("[href^=\"/" + media.type.toLowerCase() + "/" + media.id + "/\"]");
								if(target && !target.querySelector(".hohStatusDot")){
									let statusDot = create("div","hohStatusDot",false,target);
									statusDot.style.background = distributionColours[media.mediaListEntry.status];
									statusDot.title = media.mediaListEntry.status.toLowerCase();
								}
							});
						};adder(recs);
						let mutationConfig = {
							attributes: false,
							childList: true,
							subtree: false
						};
						let observer = new MutationObserver(function(){
							let recsCount = findCard.querySelectorAll(".recommendation-card").length
							if(recsCount > 25){
								let recs2 = [];
								let page = Math.trunc(recsCount/25);
								recsCount % 25 !== 0 && page++;
								authAPIcall(
`query($id: Int, $page: Int){
	Media(id:$id){
		recommendations(sort:RATING_DESC,page:$page){
			nodes{
				mediaRecommendation{
					id
					type
					mediaListEntry{status}
				}
			}
		}
	}
}`,
									{id: id, page: page},
									function(data){
										recs2 = data.data.Media.recommendations.nodes.map(
											item => item.mediaRecommendation
										).filter(
											item => item.mediaListEntry
										);
										adder(recs2)
									}
								)
							}
							else{
								adder(recs)
							}
						});
						observer.observe(findCard,mutationConfig)
					}
					else{
						setTimeout(recsAdder,300)
					}
				}
			};recsAdder();
		},
		"hohRelationStatusDot" + id,2*60*1000,
		false,false,
		function(data){
			let adder = function(){
				let mangaAnimeMatch = document.URL.match(/^https:\/\/anilist\.co\/(anime|manga)\/(\d+)\/?([^/]*)?\/?(.*)?/);
				if(!mangaAnimeMatch){
					return
				}
				if(mangaAnimeMatch[2] !== id){
					return
				}
				let rels = data.data.Media.relations.nodes.filter(media => media.mediaListEntry);
				if(rels){
					relations = document.querySelector(".relations");
					if(relations && !relations.classList.contains("hohRelationStatusDots")){
						relations.classList.add("hohRelationStatusDots");
						rels.forEach(media => {
							let target = relations.querySelector("[href^=\"/" + media.type.toLowerCase() + "/" + media.id + "/\"]");
							if(target){
								let statusDot = create("div","hohStatusDot",false,target);
								statusDot.style.background = distributionColours[media.mediaListEntry.status];
								statusDot.title = media.mediaListEntry.status.toLowerCase();
							}
						})
					}
					else{
						setTimeout(adder,300)
					}
				}
			};adder();
		}
	)
}
//end modules/addRelationStatusDot.js
//begin modules/addReviewConfidence.js
exportModule({
	id: "reviewConfidence",
	description: "$reviewConfidence_description",
	isDefault: true,
	categories: ["Browse"],
	visible: true,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/reviews/.test(url)
	},
	code: function(){
		let pageCount = 0;
		const adultContent = userObject ? userObject.options.displayAdultContent : false;

		const addReviewConfidence = async function(){
			pageCount++
			const {data, errors} = await anilistAPI("query($page:Int){Page(page:$page,perPage:30){reviews(sort:ID_DESC){id rating ratingAmount}}}", {
				variables: {page: pageCount},
				cacheKey: "hohRecentReviewsPage" + pageCount,
				duration: 30*1000,
				auth: adultContent // api doesn't return reviews for adult content unless authed + have the option enabled
			})
			if(errors){
				return;
			}
			const locationForIt = document.querySelector(".recent-reviews");
			if(!locationForIt){
				return;
			}
			const reviewWrap = locationForIt.querySelector(".review-wrap") || await watchElem(".review-wrap", locationForIt);
			data.Page.reviews.forEach(async (review) => {
				const wilsonLowerBound = wilson(review.rating,review.ratingAmount).left
				const extraScore = create("span","wilson","~" + Math.round(100*wilsonLowerBound));
				extraScore.style.color = "hsl(" + wilsonLowerBound*120 + ",100%,50%)";
				extraScore.style.marginRight = "3px";
				const votes = `[href="/review/${review.id}"] .votes`;
				const parent = reviewWrap.querySelector(votes) || await watchElem(votes, reviewWrap);
				if(parent.querySelector(".wilson")){
					return;
				}
				parent.insertBefore(extraScore,parent.firstChild);
				if(wilsonLowerBound < 0.05){
					parent.parentNode.parentNode.style.opacity = "0.5" // dim review-card
				}
				return;
			})
			return;
		}

		const checkMore = async function(){
			const container = document.querySelector(".recent-reviews");
			if(!container){
				return;
			}
			const loadMore = container.querySelector(".load-more") || await watchElem(".load-more", container);
			addReviewConfidence()
			loadMore.addEventListener("click", () => {
				addReviewConfidence()
				checkMore() // a different load more button is created, so the listener needs to be reattached
			})
			return;
		};checkMore();
	},
	css: `
	.recent-reviews .review-wrap .review-card .summary {
		margin-bottom: 15px;
	}
	`
})
//end modules/addReviewConfidence.js
//begin modules/addSocialThemeSwitch.js
function addSocialThemeSwitch(){
	let URLstuff = location.pathname.match(/^\/user\/(.*)\/social/)
	if(!URLstuff){
		return
	}
	if(document.querySelector(".filters .hohThemeSwitch")){
		return
	}
	let target = document.querySelector(".filters");
	if(!target){
		setTimeout(addSocialThemeSwitch,100);
		return;
	}
	let themeSwitch = create("div",["theme-switch","hohThemeSwitch"],false,target,"width:70px;");
	let listView = create("span",false,false,themeSwitch);
	let cardView = create("span","active",false,themeSwitch);
	listView.appendChild(svgAssets2.listView.cloneNode(true));
	cardView.appendChild(svgAssets2.cardView.cloneNode(true));
	listView.onclick = function(){
		document.querySelector(".hohThemeSwitch .active").classList.remove("active");
		listView.classList.add("active");
		document.querySelector(".user-social").classList.add("listView");
	}
	cardView.onclick = function(){
		document.querySelector(".hohThemeSwitch .active").classList.remove("active");
		cardView.classList.add("active");
		document.querySelector(".user-social.listView").classList.remove("listView");
	}
}
//end modules/addSocialThemeSwitch.js
//begin modules/addStudioBrowseSwitch.js
function addStudioBrowseSwitch(){
	let URLstuff = location.pathname.match(/^\/studio\//)
	if(!URLstuff){
		return
	}
	if(document.querySelector(".studio-page-unscoped .hohThemeSwitch")){
		return
	}
	let target = document.querySelector(".studio-page-unscoped");
	if(!target){
		setTimeout(addStudioBrowseSwitch,100);
		return;
	}
	let themeSwitch = create("div",["theme-switch","hohThemeSwitch"],false,target);
	target.classList.add("cardView");
	let listView = create("span",false,false,themeSwitch);
	listView.title = "List View";
	let cardView = create("span","active",false,themeSwitch);
	cardView.title = "Card View";
	listView.appendChild(svgAssets2.bigListView.cloneNode(true));
	cardView.appendChild(svgAssets2.compactView.cloneNode(true));
	cardView.onclick = function(){
		document.querySelector(".hohThemeSwitch .active").classList.remove("active");
		cardView.classList.add("active");
		target.classList.add("cardView");
		target.classList.remove("listView");
	}
	listView.onclick = function(){
		document.querySelector(".hohThemeSwitch .active").classList.remove("active");
		listView.classList.add("active");
		target.classList.remove("cardView");
		target.classList.add("listView");
	}
}
//end modules/addStudioBrowseSwitch.js
//begin modules/addSubTitleInfo.js
function addSubTitleInfo(){
	let URLstuff = document.URL.match(/^https:\/\/anilist\.co\/(anime|manga)\/.*/);
	if(!URLstuff){
		return
	}
	else if(document.querySelector(".hohExtraBox")){
		document.querySelector(".hohExtraBox").remove()
	}
	let sidebar = document.querySelector(".sidebar");
	if(!sidebar){
		setTimeout(addSubTitleInfo,200);
		return
	}
	let cover_inner = document.querySelector(".cover-wrap-inner");
	if(cover_inner){
		let diff = sidebar.getBoundingClientRect().top - cover_inner.getBoundingClientRect().bottom;
		if(diff < 20){
			if(sidebar.style.marginTop){
				sidebar.style.marginTop = Math.round(20 - diff + parseInt(sidebar.style.marginTop.match(/\d+/)[0])) + "px"
			}
			else{
				sidebar.style.marginTop = Math.round(20 - diff) + "px"
			}
		}
	}
	let infoNeeded = {};
	Array.from(sidebar.querySelectorAll(".data-set .type")).forEach(pair => {
		if(pair.innerText === "Native"){
			infoNeeded.native = pair.nextElementSibling.innerText
		}
		if(pair.innerText === "Romaji"){
			infoNeeded.romaji = pair.nextElementSibling.innerText
		}
		if(pair.innerText === "English"){
			infoNeeded.english = pair.nextElementSibling.innerText
		}
		else if(pair.innerText === "Format"){
			infoNeeded.format = pair.nextElementSibling.innerText;
			if(infoNeeded.format === "Manga (Chinese)"){
				infoNeeded.format = "Manhua"
			}
			else if(infoNeeded.format === "Manga (Korean)"){
				infoNeeded.format = "Manhwa"
			}
		}
		else if(pair.innerText === "Release Date" || pair.innerText === "Start Date"){
			infoNeeded.year = pair.nextElementSibling.innerText.match(/\d{4}/)[0]
		}
		else if(pair.innerText === "Studios"){
			infoNeeded.studios = pair.nextElementSibling.innerText.split("\n");
			infoNeeded.studiosLinks = Array.from(
				pair.nextElementSibling.querySelectorAll("a")
			).map(a => a.href);
		}
	});
	if(!infoNeeded.romaji){//guaranteed to exist, so a good check for if the sidebar has loaded
		setTimeout(addSubTitleInfo,200);
		return
	}
	let title = document.querySelector(".content > h1");
	let extraBox = create("div","hohExtraBox");
	title.parentNode.insertBefore(extraBox,title.nextElementSibling);
	let subTitle = create("p","value","",extraBox,"margin:2px;font-style:italic;");
	if(useScripts.titleLanguage === "NATIVE"){
		if(infoNeeded.romaji && infoNeeded.romaji !== infoNeeded.native){
			subTitle.innerText = infoNeeded.romaji
		}
		else if(infoNeeded.english && infoNeeded.english !== infoNeeded.native){
			subTitle.innerText = infoNeeded.english
		}
	}
	else if(useScripts.titleLanguage === "ENGLISH"){
		if(infoNeeded.native && infoNeeded.native !== infoNeeded.english){
			subTitle.innerText = infoNeeded.native
		}
		else if(infoNeeded.romaji && infoNeeded.romaji !== infoNeeded.english){
			subTitle.innerText = infoNeeded.romaji
		}
	}
	else{
		if(
			infoNeeded.native
			&& infoNeeded.native.replace(//convert fullwidth to regular before comparing
				/[\uff01-\uff5e]/g,
				ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
			) !== infoNeeded.romaji
		){
			subTitle.innerText = infoNeeded.native
		}
	}
	if(infoNeeded.year){
		create("a","value",infoNeeded.year,extraBox,"margin-right:10px;")
			.href = "/search/" + URLstuff[1] + "?year=" + infoNeeded.year + "%25"
	}
	if(infoNeeded.format && infoNeeded.format !== "Manga"){
		create("span","value",infoNeeded.format,extraBox,"margin-right:10px;")
	}
	if(infoNeeded.studios){
		let studioBox = create("span","value",false,extraBox);
		infoNeeded.studios.forEach((studio,i) => {
			let studiolink = create("a",false,studio,studioBox);
			studiolink.href = infoNeeded.studiosLinks[i];
			if(i < infoNeeded.studios.length - 1){
				create("span",false,", ",studioBox)
			}
		})
	}
}
//end modules/addSubTitleInfo.js
//begin modules/additionalTranslation.js
exportModule({
	id: "additionalTranslation",
	description: "$additionalTranslation_description",
	extendedDescription: `Use "Automail language" to translate some native parts of the site too`,
	isDefault: true,//logic: if translation is turned on, it should be comprehensive. Turning *off* parts of it should be the active opt
	importance: 0,
	categories: ["Script","Newly Added"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return useScripts.partialLocalisationLanguage !== "English"
	},
	code: function(){
		let times = [100,200,400,1000,2000,3000,5000,7000,10000,15000];
		let caller = function(url,element,counter){
			if(!document.URL.match(url)){
				return
			}
			if(element.multiple){
				let place = document.querySelectorAll(element.lookup);
				if(place){
					Array.from(place).forEach(elem => {
						element.multiple.forEach(possible => {
							if(possible.topNode){
								if(elem.textContent.trim() === possible.ofText){
									elem.textContent = translate(possible.replacement,undefined,possible.ofText)
									possible.translated = true
								}
							}
							else{
								if(elem.childNodes[0].textContent.trim() === possible.ofText){
									elem.childNodes[0].textContent = translate(possible.replacement,undefined,possible.ofText)
									possible.translated = true
								}
							}
						})
					})
					if(counter < times.length && !element.multiple.every(possible => possible.translated)){
						setTimeout(function(){
							caller(url,element,counter + 1)
						},times[counter])
					}
				}
				else if(counter < times.length){
					setTimeout(function(){
						caller(url,element,counter + 1)
					},times[counter])
				}
			}
			else{
				let place = document.querySelector(element.lookup);
				if(place){
					if(element.textType === "placeholder"){
						place.placeholder = translate(element.replacement)
					}
					else{
						if(place.childNodes[element.selectIndex || 0]){
							if(!element.ofText || element.ofText === place.childNodes[element.selectIndex || 0].textContent.trim()){
								place.childNodes[element.selectIndex || 0].textContent = translate(element.replacement)
							}
						}
						else{
							console.warn("translation key failed", element, place)
						}
					}
				}
				else if(counter < times.length){
					setTimeout(function(){
						caller(url,element,counter + 1)
					},times[counter])
				}
			}
		};
		[
			{
				regex: /./,
				elements: [
					{
						lookup: ".theme-selector > h2",
						replacement: "$footer_siteTheme"
					},
					{
						lookup: ".footer .links [href=\"/forum/thread/2340\"]",
						replacement: "$footer_donate"
					},
					{
						lookup: ".footer [href=\"#\"]",
						replacement: "$footer_logout"
					},
					{
						lookup: ".footer [href=\"https://submission-manual.anilist.co/\"]",
						replacement: "$footer_addData"
					},
					{
						lookup: ".footer [href=\"/moderators\"]",
						replacement: "$footer_moderators"
					},
					{
						lookup: ".footer [href=\"mailto:contact@anilist.co\"]",
						replacement: "$footer_contact"
					},
					{
						lookup: ".footer [href=\"/terms\"]",
						replacement: "$footer_terms"
					},
					{
						lookup: ".footer .links [href=\"/apps\"]",
						replacement: "$footer_apps"
					},
					{
						lookup: ".footer [href=\"/sitemap/index.xml\"]",
						replacement: "$footer_siteMap"
					},
					{
						lookup: ".footer [href=\"/site-stats\"]",
						replacement: "$stats_siteStats_title"
					},
					{
						lookup: ".footer .links [href=\"/recommendations\"]",
						replacement: "$submenu_recommendations"
					},
					{
						lookup: ".footer .links [href=\"https://github.com/AniList/ApiV2-GraphQL-Docs\"]",
						replacement: "$footer_api"
					},
					{
						lookup: "#nav .quick-search input",
						textType: "placeholder",
						replacement: "$placeholder_searchAnilist"
					},
					{
						lookup: "#nav .quick-search .hint",
						replacement: "$search_hint"
					}
				]
			},
			{
				regex: /\/user\/([^/]+)\/?$/,
				elements: [,
					{
						lookup: ".overview .genre-overview .genre > .name",
						multiple: [
							{
								ofText: "Action",
								replacement: "$genre_action"
							},
							{
								ofText: "Adventure",
								replacement: "$genre_adventure"
							},
							{
								ofText: "Comedy",
								replacement: "$genre_comedy"
							},
							{
								ofText: "Drama",
								replacement: "$genre_drama"
							},
							{
								ofText: "Ecchi",
								replacement: "$genre_ecchi"
							},
							{
								ofText: "Fantasy",
								replacement: "$genre_fantasy"
							},
							{
								ofText: "Horror",
								replacement: "$genre_horror"
							},
							{
								ofText: "Mahou Shoujo",
								replacement: "$genre_mahouShoujo"
							},
							{
								ofText: "Mecha",
								replacement: "$genre_mecha"
							},
							{
								ofText: "Music",
								replacement: "$genre_music"
							},
							{
								ofText: "Mystery",
								replacement: "$genre_mystery"
							},
							{
								ofText: "Psychological",
								replacement: "$genre_psychological"
							},
							{
								ofText: "Romance",
								replacement: "$genre_romance"
							},
							{
								ofText: "Hentai",//does this show up on profiles?
								replacement: "$genre_hentai"
							}
						]
					}
				]
			},
			{
				regex: /\/user\/([^/]+)\/?/,
				elements: [
					{
						lookup: ".activity-edit .el-textarea__inner",
						textType: "placeholder",
						replacement: "$placeholder_status"
					},
					{
						lookup: ".activity-feed-wrap h2.section-header",
						replacement: "$feed_header"
					},
					{
						lookup: ".activity-feed-wrap .load-more",
						replacement: "$load_more"
					},
					{
						lookup: ".activity-feed-wrap ul li:nth-child(1)",
						selectIndex: 1,
						replacement: "$feedSelect_all"
					},
					{
						lookup: ".activity-feed-wrap ul li:nth-child(2)",
						selectIndex: 1,
						replacement: "$feedSelect_status"
					},
					{
						lookup: ".activity-feed-wrap ul li:nth-child(3)",
						selectIndex: 1,
						replacement: "$feedSelect_message"
					},
					{
						lookup: ".activity-feed-wrap ul li:nth-child(4)",
						selectIndex: 1,
						replacement: "$feedSelect_list"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 0,
						replacement: "$menu_overview"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 2,
						replacement: "$menu_animelist"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 4,
						replacement: "$menu_mangalist"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 6,
						replacement: "$submenu_favourites"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 8,
						replacement: "$submenu_stats"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 10,
						replacement: "$submenu_social"
					},
					{
						lookup: ".user .nav.container",
						selectIndex: 12,
						replacement: "$submenu_reviews"
					},
					{
						lookup: ".user .nav.container [href$=submissions]",
						replacement: "$submenu_submissions"
					},
					{
						lookup: ".user .overview h2.section-header",
						multiple: [
							{
								ofText: "characters",
								replacement: "$submenu_characters"
							},
							{
								ofText: "Activity History",
								replacement: "$heading_activityHistory"
							},
							{
								ofText: "Genre Overview",
								replacement: "$heading_genreOverview"
							},
							{
								ofText: "staff",
								replacement: "$submenu_staff"
							},
							{
								ofText: "studios",
								replacement: "$submenu_studios"
							}
						]
					}
				]
			},
			{
				regex: /\.co\/forum\/thread\/\d+\/comment\//,
				elements: [
					{
						lookup: ".comments-header a",
						replacement: "$forum_singleThread"
					}
				]
			},
			{
				regex: /\.co\/notifications/,
				elements: [
					{
						lookup: ".notifications-feed .filter-group div.link",
						multiple: [
							{
								ofText: "All",
								replacement: "$notifications_all"
							},
							{
								ofText: "Airing",
								replacement: "$notifications_airing"
							},
							{
								ofText: "Activity",
								replacement: "$notifications_activity"
							},
							{
								ofText: "Forum",
								replacement: "$notifications_forum"
							},
							{
								ofText: "Follows",
								replacement: "$notifications_follows"
							},
							{
								ofText: "Media",
								replacement: "$notifications_media"
							}
						]
					}
				]
			},
			{
				regex: /\.co\/(manga|anime)\/\d+\/.*\/stats\/?/,
				elements: [
					{
						lookup: ".media-stats .status-distribution > h2",
						replacement: "$submenu_statusDistribution"
					},
				]
			},
			{
				regex: /\.co\/(manga|anime)\//,
				elements: [
					{
						lookup: ".media .nav",
						selectIndex: 0,
						replacement: "$menu_overview"
					},
					{
						lookup: ".media .nav [href$=characters]",
						replacement: "$submenu_characters"
					},
					{
						lookup: ".media .nav [href$=staff]",
						replacement: "$submenu_staff"
					},
					{
						lookup: ".media .nav [href$=reviews]",
						replacement: "$submenu_reviews"
					},
					{
						lookup: ".media .nav [href$=stats]",
						replacement: "$submenu_stats"
					},
					{
						lookup: ".media .nav [href$=social]",
						replacement: "$submenu_social"
					},
					{
						lookup: ".overview .characters > h2",
						replacement: "$submenu_characters"
					},
					{
						lookup: ".overview .relations > h2",
						replacement: "$submenu_relations"
					},
					{
						lookup: ".overview .status-distribution > h2",
						replacement: "$submenu_statusDistribution"
					},
					{
						lookup: ".status-distribution .statuses .status .name",
						multiple: [
							{
								ofText: "Current",
								replacement: capitalize(translate("$mediaStatus_current"))
							},
							{
								ofText: "Planning",
								replacement: capitalize(translate("$mediaStatus_planning"))
							},
							{
								ofText: "Dropped",
								replacement: capitalize(translate("$mediaStatus_dropped"))
							},
							{
								ofText: "Paused",
								replacement: capitalize(translate("$mediaStatus_paused"))
							},
							{
								ofText: "Completed",
								replacement: capitalize(translate("$mediaStatus_completed"))
							}
						]
					},
					{
						lookup: ".overview .trailer > h2",
						replacement: "$submenu_trailer"
					},
					{
						lookup: ".overview .staff > h2",
						replacement: "$submenu_staff"
					},
					{
						lookup: ".overview .recommendations > h2",
						replacement: "$submenu_recommendations"
					},
					{
						lookup: ".overview .reviews > h2",
						replacement: "$submenu_reviews"
					},
					{
						lookup: ".sidebar .review.button:not(.edit) span",
						replacement: "$button_review"
					},
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Add to List",
						replacement: capitalize(translate("$mediaStatus_not"))
					},
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Dropped",
						replacement: capitalize(translate("$mediaStatus_dropped"))
					}
				]
			},
			{
				regex: /\.co\/anime\//,
				elements: [
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Watching",
						replacement: capitalize(translate("$mediaStatus_watching"))
					},
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Completed",
						replacement: capitalize(translate("$mediaStatus_completedWatching"))
					},
					{
						lookup: ".sidebar .data-set .type",
						multiple: [
							{
								ofText: "Airing",
								replacement: "$dataSet_airing"
							},
							{
								ofText: "Format",
								replacement: "$dataSet_format"
							},
							{
								ofText: "Episodes",
								replacement: "$dataSet_episodes"
							},
							{
								ofText: "Episode\n\t\t\tDuration",
								topNode: true,
								replacement: "$dataSet_episodeDuration"
							},
							{
								ofText: "Duration",
								replacement: "$dataSet_duration"
							},
							{
								ofText: "Status",
								replacement: "$dataSet_status"
							},
							{
								ofText: "Start Date",
								replacement: "$dataSet_startDate"
							},
							{
								ofText: "End Date",
								replacement: "$dataSet_endDate"
							},
							{
								ofText: "Release Date",
								replacement: "$dataSet_releaseDate"
							},
							{
								ofText: "Season",
								replacement: "$dataSet_season"
							},
							{
								ofText: "Average Score",
								replacement: "$dataSet_averageScore"
							},
							{
								ofText: "Mean Score",
								replacement: "$dataSet_meanScore"
							},
							{
								ofText: "Popularity",
								replacement: "$dataSet_popularity"
							},
							{
								ofText: "Favorites",
								replacement: "$dataSet_favorites"
							},
							{
								ofText: "Studios",
								replacement: "$dataSet_studios"
							},
							{
								ofText: "Producers",
								replacement: "$dataSet_producers"
							},
							{
								ofText: "Source",
								replacement: "$dataSet_source"
							},
							{
								ofText: "Hashtag",
								replacement: "$dataSet_hashtag"
							},
							{
								ofText: "Genres",
								replacement: "$dataSet_genres"
							},
							{
								ofText: "Romaji",
								replacement: "$dataSet_romaji"
							},
							{
								ofText: "English",
								replacement: "$dataSet_english"
							},
							{
								ofText: "Native",
								replacement: "$dataSet_native"
							},
							{
								ofText: "Synonyms",
								replacement: "$dataSet_synonyms"
							}
						]
					}
				]
			},
			{
				regex: /\.co\/manga\//,
				elements: [
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Reading",
						replacement: capitalize(translate("$mediaStatus_reading"))
					},
					{
						lookup: ".media .header .actions .list .add",
						ofText: "Completed",
						replacement: capitalize(translate("$mediaStatus_completedReading"))
					},
					{
						lookup: ".sidebar .data-set .type",
						multiple: [
							{
								ofText: "Format",
								replacement: "$dataSet_format"
							},
							{
								ofText: "Chapters",
								replacement: "$dataSet_chapters"
							},
							{
								ofText: "Volumes",
								replacement: "$dataSet_volumes"
							},
							{
								ofText: "Status",
								replacement: "$dataSet_status"
							},
							{
								ofText: "Start Date",
								replacement: "$dataSet_startDate"
							},
							{
								ofText: "End Date",
								replacement: "$dataSet_endDate"
							},
							{
								ofText: "Average Score",
								replacement: "$dataSet_averageScore"
							},
							{
								ofText: "Mean Score",
								replacement: "$dataSet_meanScore"
							},
							{
								ofText: "Popularity",
								replacement: "$dataSet_popularity"
							},
							{
								ofText: "Favorites",
								replacement: "$dataSet_favorites"
							},
							{
								ofText: "Source",
								replacement: "$dataSet_source"
							},
							{
								ofText: "Hashtag",
								replacement: "$dataSet_hashtag"
							},
							{
								ofText: "Genres",
								replacement: "$dataSet_genres"
							},
							{
								ofText: "Romaji",
								replacement: "$dataSet_romaji"
							},
							{
								ofText: "English",
								replacement: "$dataSet_english"
							},
							{
								ofText: "Native",
								replacement: "$dataSet_native"
							},
							{
								ofText: "Synonyms",
								replacement: "$dataSet_synonyms"
							}
						]
					}
				]
			},
			{
				regex: /\/user\/([^/]+)\/(animelist|mangalist)\/?/,
				elements: [
					{
						lookup: ".filters-wrap [placeholder='Filter']",
						textType: "placeholder",
						replacement: "$mediaList_filter"
					},
					{
						lookup: ".filters-wrap [placeholder='Genres']",
						textType: "placeholder",
						replacement: "$stats_genre"
					},
					{
						lookup: ".filters-wrap [placeholder='Format']",
						textType: "placeholder",
						replacement: "$editor_format"
					},
					{
						lookup: ".filters-wrap [placeholder='Status']",
						textType: "placeholder",
						replacement: "$editor_status"
					},
					{
						lookup: ".filters-wrap [placeholder='Country']",
						textType: "placeholder",
						replacement: "$editor_country"
					},
					{
						lookup: ".filters .filter-group .group-header",
						multiple: [
							{
								ofText: "Lists",
								replacement: "$filters_lists"
							},
							{
								ofText: "Filters",
								replacement: "$filters"
							},
							{
								ofText: "Year",
								replacement: "$filters_year"
							},
							{
								ofText: "Sort",
								replacement: "$staff_sort"
							}
						]
					},
					{
						lookup: ".filters .filter-group > span",
						multiple: [
							{
								ofText: "all",
								replacement: "$mediaStatus_all"
							},
							{
								ofText: "Watching",
								replacement: "$mediaStatus_watching"
							},
							{
								ofText: "Reading",
								replacement: "$mediaStatus_reading"
							},
							{
								ofText: "Rewatching",
								replacement: "$mediaStatus_rewatching"
							},
							{
								ofText: "Rereading",
								replacement: "$mediaStatus_rereading"
							},
							{
								ofText: "Completed",
								replacement: "$mediaStatus_completed"
							},
							{
								ofText: "Paused",
								replacement: "$mediaStatus_paused"
							},
							{
								ofText: "Dropped",
								replacement: "$mediaStatus_dropped"
							},
							{
								ofText: "Planning",
								replacement: "$mediaStatus_planning"
							}
						]
					}
				]
			},
			{
				regex: /\/home\/?$/,
				elements: [
					{
						lookup: ".activity-edit .el-textarea__inner",
						textType: "placeholder",
						replacement: "$placeholder_status"
					},
					{
						lookup: ".activity-feed-wrap h2.section-header",
						replacement: "$feed_header"
					},
					{
						lookup: ".activity-feed-wrap .load-more",
						replacement: "$load_more"
					},
					{
						lookup: ".feed-select ul li:nth-child(1)",
						selectIndex: 1,
						replacement: " " + translate("$feedSelect_all") + " "
					},
					{
						lookup: ".feed-select ul li:nth-child(2)",
						selectIndex: 1,
						replacement: " " + translate("$feedSelect_text") + " "
					},
					{
						lookup: ".feed-select ul li:nth-child(3)",
						selectIndex: 1,
						replacement: " " + translate("$feedSelect_list") + " "
					},
					{
						lookup: ".feed-select .feed-type-toggle div:nth-child(1)",
						replacement: "$filter_following"
					},
					{
						lookup: ".feed-select .feed-type-toggle div:nth-child(2)",
						replacement: "$terms_option_global"
					},
					{
						lookup: ".list-preview-wrap .section-header h2",
						multiple: [
							{
								ofText: "Manga in Progress",
								replacement: "$preview_mangaSection_title"
							},
							{
								ofText: "Anime in Progress",
								replacement: "$preview_animeSection_title"
							}
						]
					}
					//see also: middleClickLinkFixer.js
				]
			},
			{
				regex: /\/reviews\/?$/,
				elements: [
					{
						lookup: ".load-more",
						replacement: "$load_more"
					}
				]
			},
			{
				regex: /\/activity\//,
				elements: [
					{
						lookup: "[placeholder='Write a reply...']",
						textType: "placeholder",
						replacement: "$placeholder_reply"
					}
				]
			},
			{
				regex: /\/search\//,
				elements: [
					{
						lookup: ".primary-filters .filter-select > .name",
						multiple: [
							{
								ofText: "Search",
								replacement: "$filters_search"
							},
							{
								ofText: "genres",
								replacement: "$filters_genres"
							},
							{
								ofText: "year",
								replacement: "$filters_year"
							},
							{
								ofText: "format",
								replacement: "$filters_format"
							},
							{
								ofText: "country of origin",
								replacement: "$filters_countryOfOrigin"
							}
						]
					}
				]
			},
			{
				regex: /\/search\/anime/,
				elements: [
					{
						lookup: ".primary-filters .filter-select > .name",
						multiple: [
							{
								ofText: "season",
								replacement: "$filters_season"
							},
							{
								ofText: "airing status",
								replacement: "$filters_airingStatus"
							}
						]
					}
				]
			},
			{
				regex: /\/search\/anime\/?$/,
				elements: [
					{
						lookup: ".search-landing h3",
						multiple: [
							{
								ofText: "Trending now",
								replacement: "$searchLanding_trending"
							},
							{
								ofText: "Popular this season",
								replacement: "$searchLanding_popularSeason"
							},
							{
								ofText: "Upcoming next season",
								replacement: "$searchLanding_nextSeason"
							},
							{
								ofText: "All time popular",
								replacement: "$searchLanding_popular"
							},
							{
								ofText: "Top 100 Anime",
								replacement: "$searchLanding_topAnime"
							}
						]
					}
				]
			},
			{
				regex: /\/search\/manga/,
				elements: [
					{
						lookup: ".primary-filters .filter-select > .name",
						multiple: [
							{
								ofText: "publishing status",
								replacement: "$filters_publishingStatus"
							}
						]
					}
				]
			},
			{
				regex: /co\/staff\/?/,
				elements: [
					{
						lookup: ".description-wrap .data-point .label",
						multiple: [
							{
								ofText: "Birth:",
								replacement: "$staffData_birth"
							},
							{
								ofText: "Death:",
								replacement: "$staffData_death"
							},
							{
								ofText: "Age:",
								replacement: "$staffData_age"
							},
							{
								ofText: "Gender:",
								replacement: "$staffData_gender"
							},
							{
								ofText: "Years active:",
								replacement: "$staffData_yearsActive"
							},
							{
								ofText: "Hometown:",
								replacement: "$staffData_hometown"
							},
							{
								ofText: "Blood Type:",
								replacement: "$staffData_bloodType"
							},
							{
								ofText: "Circle:",
								replacement: "$staffData_circle"
							},
							{
								ofText: "Residency:",
								replacement: "$staffData_residency"
							},
							{
								ofText: "Graduated:",
								replacement: "$staffData_graduated"
							}
						]
					}
				]
			},
			{
				regex: /co\/character\/?/,
				elements: [
					{
						lookup: ".description-wrap .data-point .label",
						multiple: [
							{
								ofText: "Birthday:",
								replacement: "$staffData_birthday_DUPLICATE"
							},
							{
								ofText: "Death:",
								replacement: "$staffData_death"
							},
							{
								ofText: "Age:",
								replacement: "$staffData_age"
							},
							{
								ofText: "Gender:",
								replacement: "$staffData_gender"
							},
							{
								ofText: "Hometown:",
								replacement: "$staffData_hometown"
							},
							{
								ofText: "Blood Type:",
								replacement: "$staffData_bloodType"
							}
						]
					}
				]
			},
			{
				regex: /\/forum\/?(overview|recent)?\/?$/,
				elements: [
					{
						lookup: ".overview-header[href='/forum/recent']",
						replacement: "$forumHeading_recentlyActive"
					},
					{
						lookup: ".overview-header[href='/forum/recent?category=5']",
						replacement: "$forumHeading_releaseDiscussion"
					},
					{
						lookup: ".overview-header[href='/forum/new']",
						replacement: "$forumHeading_newThreads"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=7']",
						replacement: "$forumCategory_7"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=1']",
						replacement: "$forumCategory_1"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=2']",
						replacement: "$forumCategory_2"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=5']",
						replacement: "$forumCategory_5"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=13']",
						replacement: "$forumCategory_13"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=8']",
						replacement: "$forumCategory_8"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=9']",
						replacement: "$forumCategory_9"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=10']",
						replacement: "$forumCategory_10"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=4']",
						replacement: "$forumCategory_4"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=3']",
						replacement: "$forumCategory_3"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=16']",
						replacement: "$forumCategory_16"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=15']",
						replacement: "$forumCategory_15"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=11']",
						replacement: "$forumCategory_11"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=12']",
						replacement: "$forumCategory_12"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=18']",
						replacement: "$forumCategory_18"
					},
					{
						lookup: ".filter-group [href='/forum/recent?category=17']",
						replacement: "$forumCategory_17"
					}
				]
			},
		].forEach(matchset => {
			if(document.URL.match(matchset.regex)){
				matchset.elements.forEach(element => {
					caller(matchset.regex,element,0)
				})
			}
		})
	}
})

function editor_translate(editor){
	let times = [100,200,400,1000,2000,3000,5000,7000,10000,15000];
	let caller = function(element,counter){
		if(element.multiple){
			let place = editor.querySelectorAll(element.lookup);
			if(place){
				Array.from(place).forEach(elem => {
					element.multiple.forEach(possible => {
						if(elem.childNodes[0].textContent.trim() === possible.ofText){
							elem.childNodes[0].textContent = translate(possible.replacement)
							possible.translated = true
						}
					})
				})
				if(counter < times.length && !element.multiple.every(possible => possible.translated)){
					setTimeout(function(){
						caller(url,element,counter + 1)
					},times[counter])
				}
			}
			else if(counter < times.length){
				setTimeout(function(){
					caller(element,counter + 1)
				},times[counter])
			}
		}
		else{
			let place = editor.querySelector(element.lookup);
			if(place){
				if(element.textType === "placeholder"){
					place.placeholder = translate(element.replacement)
				}
				else{
					if(place.childNodes[element.selectIndex || 0]){
						place.childNodes[element.selectIndex || 0].textContent = translate(element.replacement)
					}
					else{
						console.warn("editor translation key failed", element, place)
					}
				}
			}
			else if(counter < times.length){
				setTimeout(function(){
					caller(element,counter + 1)
				},times[counter])
			}
		}
	};
	[
		{
			elements: [
				{
					lookup: ".form.status > .input-title",
					replacement: "$editor_status"
				},
				{
					lookup: ".form.score > .input-title",
					replacement: "$editor_score"
				},
				{
					lookup: ".form.progress > .input-title",
					replacement: "$editor_progress"
				},
				{
					lookup: ".form.start > .input-title",
					replacement: "$editor_startDate"
				},
				{
					lookup: ".form.finish > .input-title",
					replacement: "$editor_finishDate"
				},
				{
					lookup: ".form.notes > .input-title",
					replacement: "$editor_notes"
				},
				{
					lookup: ".manga .form.repeat > .input-title",
					replacement: "$editor_mangaRepeat"
				},
				{
					lookup: ".manga .form.volumes > .input-title",
					replacement: "$editor_volumes"
				},
				{
					lookup: ".anime .form.repeat > .input-title",
					replacement: "$editor_animeRepeat"
				},
				{
					lookup: ".save-btn",
					replacement: "$button_save"
				},
				{
					lookup: ".delete-btn",
					replacement: "$button_delete"
				},
				{
					lookup: ".custom-lists > .input-title",
					replacement: "$editor_customLists"
				},
				{
					lookup: ".custom-lists ~ .checkbox .el-checkbox__label",
					multiple: [
						{
							ofText: "Hide from status lists",
							replacement: "$editor_hideFromStatusLists"
						},
						{
							ofText: "Private",
							replacement: "$editor_private"
						}
					]
				},
				{
					lookup: ".status .el-input__inner",
					textType: "placeholder",
					replacement: "$editor_statusPlaceholder"
				},
				{
					lookup: ".anime .status .el-select-dropdown__item span",
					multiple: [
						{
							ofText: "Watching",
							replacement: capitalize(translate("$mediaStatus_watching"))
						},
						{
							ofText: "Plan to watch",
							replacement: capitalize(translate("$mediaStatus_planningAnime"))
						},
						{
							ofText: "Completed",
							replacement: capitalize(translate("$mediaStatus_completedWatching"))
						},
						{
							ofText: "Rewatching",
							replacement: capitalize(translate("$mediaStatus_rewatching"))
						},
						{
							ofText: "Paused",
							replacement: capitalize(translate("$mediaStatus_paused"))
						},
						{
							ofText: "Dropped",
							replacement: capitalize(translate("$mediaStatus_dropped"))
						},
					]
				},
				{
					lookup: ".manga .status .el-select-dropdown__item span",
					multiple: [
						{
							ofText: "Reading",
							replacement: capitalize(translate("$mediaStatus_reading"))
						},
						{
							ofText: "Plan to read",
							replacement: capitalize(translate("$mediaStatus_planningManga"))
						},
						{
							ofText: "Completed",
							replacement: capitalize(translate("$mediaStatus_completedReading"))
						},
						{
							ofText: "Rereading",
							replacement: capitalize(translate("$mediaStatus_rereading"))
						},
						{
							ofText: "Paused",
							replacement: capitalize(translate("$mediaStatus_paused"))
						},
						{
							ofText: "Dropped",
							replacement: capitalize(translate("$mediaStatus_dropped"))
						},
					]
				},
			]
		},
	].forEach(matchset => {
		matchset.elements.forEach(element => {
			caller(element,0)
		})
	})
}
//end modules/additionalTranslation.js
//begin modules/altBanner.js
exportModule({
	id: "altBanner",
	description: "$altBanner_description",
	extendedDescription: "$altBanner_extendedDescription",
	isDefault: false,
	importance: 0,
	categories: ["Media","Newly Added"],
	visible: true,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/(anime|manga)\/.*/.test(url)
	},
	code: function(){
		let adder = function(mutations,observer){
			let pNode = document.querySelector(".media .header-wrap");
			if(!pNode){
				setTimeout(adder,200);
				return
			}
			if(pNode.childNodes[0] && pNode.childNodes[0].nodeType === 8){
				return
			}
			let banner = pNode.querySelector(".banner");
			if(!banner && !observer){
				let mutationConfig = {
					attributes: false,
					childList: true,
					subtree: false
				}
				let observer = new MutationObserver(adder);
				observer.observe(pNode,mutationConfig);
				return
			}
			else if(!banner){
				return
			}
			observer && observer.disconnect();
			banner.classList.add("blur-filter");
			let bannerFull = document.querySelector(".altBanner") || create("img","altBanner",null,banner);
			bannerFull.height = "400";
			bannerFull.src = banner.style.backgroundImage.replace("url(","").replace(")","").replace('"',"").replace('"',"")
		}
		adder()
	},
	css: `
	.media .header-wrap .banner{
		margin-top: 0px !important;
		position: relative;
		z-index: -2;
	}
	.blur-filter::after{
		backdrop-filter: blur(10px);
		content: "";
		display: block;
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		z-index: -2;
	}
	.altBanner{
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%);
		z-index: -1;
	}
	`
})
//end modules/altBanner.js
//begin modules/anisongs.js
//fork of anisongs by morimasa
//https://greasyfork.org/en/scripts/374785-anisongs
const anisongs_temp = {
	last: null,
	target: null
}

exportModule({
	id: "anisongs",
	description: "$anisongs_description",
	isDefault: true,
	categories: ["Media"],
	visible: true,
	urlMatch: function(url,oldUrl){
    return /^https:\/\/anilist\.co\/(anime|manga)\/[0-9]+\/.*/.test(url)
	},
	code: function(){
const options = {
  cacheTTL: 604800000, // 1 week in ms
  class: 'anisongs', // container class
}

const songCache = localforage.createInstance({name: script_type.toLowerCase(), storeName: "anisongs"});

const API = {
  async getSongs(mal_id) {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}/themes`)
    return res.json()
  },
  async getVideos(anilist_id) {
    const res = await fetch(`https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${anilist_id}&include=animethemes.animethemeentries.videos`)
    return res.json()
  }
}

class VideoElement {
  constructor(parent, url) {
    this.url = url
    this.parent = parent
    this.make()
  }

  toggle() {
    if (this.el.parentNode) {
      this.el.remove()
    }
    else {
      this.parent.append(this.el)
      this.el.children[0].autoplay = true // autoplay
    }
  }

  make() {
    const box = document.createElement('div'),
          vid = document.createElement('video')
    vid.src = this.url
    vid.controls = true
    vid.preload = "none"
    vid.volume = 0.4
    box.append(vid)
    this.el = box
  }
}

class Videos {
  constructor(id) {
    this.id = id
  }

  async get() {
    const {anime} = await API.getVideos(this.id);
    if(anime.length === 0){
      return {"OP":[], "ED":[]}
    }
    return Videos.groupTypes(anime[0].animethemes)
  }

  static groupTypes(songs) {
    const groupBy = (xs, key) => {
      return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };
    return groupBy(songs, "type")
  }

  static merge(entries, videos) {
    const cleanTitle = song => {
      return song.replace(/^\d{1,2}:/, "")
    }
    const findUrl = n => {
      let url;
      if(videos[n]) {
        if(videos[n].animethemeentries[0] && videos[n].animethemeentries[0].videos[0]){
          url = videos[n].animethemeentries[0].videos[0].link
        }
        if(url) url = url.replace(/staging\./, "")
      }
      return url
    }
    if(videos) {
      return entries.map((e, i) => {
        return {
          title: cleanTitle(e),
          url: findUrl(i)
        }
      })
    }
    return entries.map((e, i) => {
      return {
        title: cleanTitle(e)
      }
    })
  }
}

function insert(songs, parent) {
  if (!songs || !songs.length) {
    create("div",false,translate("$anisongs_noSongs") + " (つ﹏<)･ﾟ｡",parent,"text-align:center");
  }
  else {
    songs.forEach( (song, i) => {
      const txt = `${i+1}. ${song.title || song}`;
      const node = create("div","anisong-entry",txt,parent);
      if (song.url) {
        const vid = new VideoElement(node, song.url)
        node.addEventListener("click", () => vid.toggle())
        node.classList.add("has-video")
      }
    })
  }
}

function createTargetDiv(text, target, pos) {
  let el = document.createElement('div');
  el.appendChild(document.createElement('h2'));
  el.children[0].innerText = text;
  el.classList = options.class;
  target.insertBefore(el, target.children[pos]);
  return el;
}

function cleaner(target) {
  if (!target) return;
  let el = target.querySelectorAll(`.${options.class}`);
  el.forEach(e => target.removeChild(e))
}

function placeData(data) {
  cleaner(anisongs_temp.target);
  let op = createTargetDiv(translate("$anisongs_openings"), anisongs_temp.target, 0);
  if(data.opening_themes.length === 1){
    op.children[0].innerText = translate("$anisongs_opening")
  }
  let ed = createTargetDiv(translate("$anisongs_endings"), anisongs_temp.target, 1);
  if(data.ending_themes.length === 1){
    ed.children[0].innerText = translate("$anisongs_ending")
  }
  insert(data.opening_themes, op);
  insert(data.ending_themes, ed);
}

async function launch(currentid) {
  // get from cache and check TTL
  const cache = await songCache.getItem(currentid) || {time: 0};
  if(
    (cache.time + options.cacheTTL)
    < +new Date()
  ) {
    const {data, errors} = await anilistAPI("query($id:Int){Media(id:$id){idMal status}}", {
      variables: {id: currentid}
    });
    if(errors){
      return "AniList API failure"
    }
    const {idMal: mal_id, status} = data.Media;
    if (mal_id) {
      const {data} = await API.getSongs(mal_id);
      if(!data){
        return "No songs"
      }
      let {openings: opening_themes, endings: ending_themes} = data;
      // add songs to cache if they're not empty and query videos
      if (opening_themes.length || ending_themes.length) {
        if (["FINISHED", "RELEASING"].includes(status)) {
          try {
            const _videos = await new Videos(currentid).get()
            opening_themes = Videos.merge(opening_themes, _videos.OP)
            ending_themes = Videos.merge(ending_themes, _videos.ED)
          }
          catch(e){console.log("Anisongs", e)} // 🐟
        }
        await songCache.setItem(currentid, {opening_themes, ending_themes, time: +new Date()});
      }
      // place the data onto site
      placeData({opening_themes, ending_themes});
      return "Downloaded songs"
    }
    else {
      return "No malid"
    }
  }
  else {
    // place the data onto site
    placeData(cache);
    return "Used cache"
  }
}

let currentpath = location.pathname.match(/(anime|manga)\/([0-9]+)\/[^/]*\/?(.*)/)
if(currentpath[1] === "anime") {
	let currentid = currentpath[2];
	let location = currentpath[3];
	if(location !== ""){
		anisongs_temp.last = 0
	}
	anisongs_temp.target = document.querySelectorAll(".grid-section-wrap")[2];
	if(anisongs_temp.last !== currentid && location === ""){
		if(anisongs_temp.target){
			anisongs_temp.last = currentid;
			launch(currentid)
		}
		else{
			setTimeout(()=>{this.code.call(this)},500)
		}
	}
}
else if(currentpath[1] === "manga"){
	cleaner(anisongs_temp.target);
	anisongs_temp.last = 0
}
else{
	anisongs_temp.last = 0
}
	}
})
//end modules/anisongs.js
//begin modules/autoLogin.js
exportModule({
	boneless_disable: true,
	id: "autoLogin",
	description: "$autoLogin_description",
	extendedDescription: `
Normally, ${script_type} will stay signed in even if you close your browser.

However, if you have all persistant storage turned off, that's not possible.
To use features that requires an Anilist login, you will normally have to click the "sign in" link on the settings page each time.

In those cases, this module tries to automatically sign in when first visiting the page, potentially saving you a few clicks.

IMPORTANT DETAILS FOR THIS MODULE TO WORK!

This module is off by default. In some cases of non-persistance storage, ${script_type} will always load at default settings, thus checking this checkbox will do absolutely nothing.
To change the defaults:

Option a) When building from source edit "src/modules/autoLogin.js" so "isDefault" is set to true

Option b) Manually add your access token in the file "src/settings.js". It's a field in the "useScripts" object.

Option c) If you just have the compiled JS file "${script_type.toLowerCase()}.js", search for "I EAT PANCAKES" in the code, and change "isDefault" line below to true
`,
	isDefault: false,
	categories: ["Script"],
	visible: true
})
//end modules/autoLogin.js
//begin modules/betterListPreview.js
function betterListPreview(){
	if(window.screen.availWidth && window.screen.availWidth <= 1040){
		return
	}
	let errorHandler = function(e){
		console.error(e);
		console.warn("Alternative list preview failed. Trying to bring back the native one");
		let hohListPreviewToRemove = document.getElementById("hohListPreview");
		if(hohListPreviewToRemove){
			hohListPreviewToRemove.remove()
		}
		document.querySelectorAll(".list-preview-wrap").forEach(wrap => {
			wrap.style.display = "block"
		})
	}
	try{//it's complex, and could go wrong. Furthermore, we want a specific behavour when it fails, namely bringing back the native preview
	let hohListPreview = document.getElementById("hohListPreview");
	if(hohListPreview){
		return
	}
	let buildPreview = function(data,overWrite){try{
		if(!data){
			return
		}
		if(!hohListPreview){
			overWrite = true;
			let listPreviews = document.querySelectorAll(".list-previews h2");
			if(!listPreviews.length){
				setTimeout(function(){buildPreview(data)},200);
				return
			}
			hohListPreview = create("div","#hohListPreview");
			listPreviews[0].parentNode.parentNode.parentNode.parentNode.insertBefore(hohListPreview,listPreviews[0].parentNode.parentNode.parentNode);
			listPreviews.forEach(heading => {
				if(!heading.innerText.includes("Manga") && !heading.innerText.includes(translate("$preview_mangaSection_title"))){
					heading.parentNode.parentNode.style.display = "none"
				}
				else if(useScripts.additionalTranslation){
					heading.childNodes[0].textContent = translate("$preview_mangaSection_title")
				}
			})
		}
		if(overWrite){
			let mediaLists = data.data.Page.mediaList.map((mediaList,index) => {
				mediaList.index = index;
				if(aliases.has(mediaList.media.id)){
					mediaList.media.title.userPreferred = aliases.get(mediaList.media.id)
				}
				return mediaList
			});
			let notAiring = mediaLists.filter(
				mediaList => !mediaList.media.nextAiringEpisode
			)
			let airing = mediaLists.filter(
				mediaList => mediaList.media.nextAiringEpisode
			).map(
				mediaList => {
					mediaList.points = 100/(mediaList.index + 1) + mediaList.priority/10 + (mediaList.scoreRaw || 60)/10;
					if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
						mediaList.points -= 100/(mediaList.index + 1);
					}
					if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*24){
						mediaList.points += 1;
						if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
							mediaList.points += 1;
						}
					}
					if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*12){
						mediaList.points += 1;
						if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
							mediaList.points += 2;
						}
					}
					if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*3){
						mediaList.points += 1;
						if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
							mediaList.points += 2;
						}
					}
					if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*1){
						mediaList.points += 1;
						if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
							mediaList.points += 3;
						}
					}
					if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*10){
						mediaList.points += 1;
						if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1){
							mediaList.points += 5;
						}
						else if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 2){
							mediaList.points += 2;
						}
					}
					if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 2){
						mediaList.points += 7;
						if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*24*7){
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*6){
								mediaList.points += 3;
							}
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*7 - 60*60*3){
								mediaList.points += 3;
							}
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*7 - 60*60*1){
								mediaList.points += 3;
							}
						}
					}
					else if(mediaList.progress === mediaList.media.nextAiringEpisode.episode - 3){
						mediaList.points += 2;
						if(mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*24*7){
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*6){
								mediaList.points += 1;
							}
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*7 - 60*60*3){
								mediaList.points += 1;
							}
							if(mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*7 - 60*60*1){
								mediaList.points += 1;
							}
						}
					}
					return mediaList;
				}
			).sort(
				(b,a) => a.points - b.points
			);
			let airingImportant = mediaLists.filter(
				(mediaList,index) => mediaList.media.nextAiringEpisode && (
					index < useScripts.previewMaxRows*5
					|| mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*4
					|| (
						mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*12
						&& mediaList.progress === mediaList.media.nextAiringEpisode.episode - 1
					)
					|| (
						mediaList.media.nextAiringEpisode.timeUntilAiring > 60*60*24*6
						&& mediaList.media.nextAiringEpisode.timeUntilAiring < 60*60*24*7
						&& mediaList.progress === mediaList.media.nextAiringEpisode.episode - 2
					)
				)
			).length;
			if(airingImportant > 3){
				airingImportant = Math.min(5*Math.ceil((airingImportant - 1)/5),airing.length)
			}
			removeChildren(hohListPreview)
			let drawSection = function(list,name,moveExpander){
				let airingSection = create("div","list-preview-wrap",false,hohListPreview,"margin-bottom: 20px;");
				let airingSectionHeader = create("div","section-header",false,airingSection);
				if(name === "Airing"){
					create("a","asHeading",name,airingSectionHeader,"font-size: 1.4rem;font-weight: 500;")
						.href = "https://anilist.co/airing"
				}
				else{
					create("h2",false,name,airingSectionHeader,"font-size: 1.4rem;font-weight: 500;")
				}
				if(moveExpander && document.querySelector(".size-toggle")){
					airingSectionHeader.appendChild(document.querySelector(".size-toggle"))
				}
				let airingListPreview = create("div","list-preview",false,airingSection,"display:grid;grid-template-columns: repeat(5,85px);grid-template-rows: repeat(auto-fill,115px);grid-gap: 20px;padding: 20px;background: rgb(var(--color-foreground));");
				list.forEach((air,index) => {
					let card = create("div",["media-preview-card","small","hohFallback"],false,airingListPreview,"width: 85px;height: 115px;background: rgb(var(--color-foreground));border-radius: 3px;display: inline-grid;");
					if(air.media.coverImage.color && !useScripts.SFWmode){
						card.style.backgroundColor = air.media.coverImage.color
					}
					if((index % 5 > 1) ^ useScripts.rightToLeft){
						card.classList.add("info-left")
					}
					let cover = create("a","cover",false,card,"background-position: 50%;background-repeat: no-repeat;background-size: cover;text-align: center;border-radius: 3px;");
					cover.style.backgroundImage = "url(\"" + air.media.coverImage.large + "\")";
					cover.href = "/anime/" + air.media.id + "/" + safeURL(air.media.title.userPreferred);
					if(air.media.nextAiringEpisode){
						let imageText = create("div","image-text",false,cover,"background: rgba(var(--color-overlay),.7);border-radius: 0 0 3px 3px;bottom: 0;color: rgba(var(--color-text-bright),.91);display: inline-block;font-weight: 400;left: 0;letter-spacing: .2px;margin-bottom: 0;position: absolute;transition: .3s;width: 100%;font-size: 1.1rem;line-height: 1.2;padding: 8px;");
						let imageTextWrapper = create("div","countdown",false,imageText);
						let createCountDown = function(){
							removeChildren(imageTextWrapper)
							create("span",false,translate("$notification_epShort",air.media.nextAiringEpisode.episode),imageTextWrapper);
							create("br",false,false,imageTextWrapper);
							if(air.media.nextAiringEpisode.timeUntilAiring <= 0){
								create("span",false,"Recently aired",imageTextWrapper);
								return;
							}
							let days = Math.floor(air.media.nextAiringEpisode.timeUntilAiring/(60*60*24));
							let hours = Math.floor((air.media.nextAiringEpisode.timeUntilAiring - days*(60*60*24))/3600);
							let minutes = Math.round((air.media.nextAiringEpisode.timeUntilAiring - days*(60*60*24) - hours*3600)/60);
							if(minutes === 60){
								hours++;
								minutes = 0;
								if(hours === 24){
									days++;
									hours = 0;
								}
							}
							if(days){
								create("span",false,days + translate("$time_short_day",null,"d") + " ",imageTextWrapper)
							}
							if(hours){
								create("span",false,hours + translate("$time_short_hour",null,"h") + " ",imageTextWrapper)
							}
							if(minutes){
								create("span",false,minutes + translate("$time_short_minute",null,"m"),imageTextWrapper)
							}
							setTimeout(function(){
								air.media.nextAiringEpisode.timeUntilAiring -= 60;
								createCountDown();
							},60*1000);
						};createCountDown();
						const behind = air.media.nextAiringEpisode.episode - 1 - air.progress;
						if(behind > 0){
							create("div","behind-accent",false,imageText,"background: rgb(var(--color-red));border-radius: 0 0 2px 2px;bottom: 0;height: 5px;left: 0;position: absolute;transition: .2s;width: 100%;")
						}
					}
					let imageOverlay = create("div","image-overlay",false,cover);
					let plusProgress = create("div","plus-progress",air.progress + " +",imageOverlay);
					let content = create("div","content",false,card);
					if(air.media.nextAiringEpisode){
						const behind = air.media.nextAiringEpisode.episode - 1 - air.progress;
						if(behind > 0){
							let infoHeader = create("div","info-header",false,content,"color: rgb(var(--color-blue));font-size: 1.2rem;font-weight: 500;margin-bottom: 8px;");
							if(behind > 1){
								create("div",false,translate("$preview_Mbehind",behind),infoHeader)
							}
							else{
								create("div",false,translate("$preview_1behind"),infoHeader)
							}
						}
					}
					let title = create("a","title",air.media.title.userPreferred,content,"font-size: 1.4rem;");
					let info = create("div",["info","hasMeter"],false,content,"bottom: 12px;color: rgb(var(--color-text-lighter));font-size: 1.2rem;left: 12px;position: absolute;");
					let pBar;
					if(air.media.episodes && useScripts.progressBar){
						pBar = create("meter",false,false,info);
						pBar.value = air.progress;
						pBar.min = 0;
						pBar.max = air.media.episodes;
						if(air.media.nextAiringEpisode){
							pBar.low = air.media.nextAiringEpisode.episode - 2;
							pBar.high = air.media.nextAiringEpisode.episode - 1;
							pBar.optimum = air.media.nextAiringEpisode.episode - 1;
						}
					}
					let progress = create("div",false,translate("$preview_progress") + " " + air.progress + (air.media.episodes ? "/" + air.media.episodes : ""),info);
					let isBlocked = false;
					plusProgress.onclick = function(e){
						if(isBlocked){
							return
						}
						if(air.media.episodes){
							if(air.progress < air.media.episodes){
								if(useScripts.progressBar){
									pBar.value++;
								}
								air.progress++;
								progress.innerText = "Progress: " + air.progress + (air.media.episodes ? "/" + air.media.episodes : "");
								isBlocked = true;
								setTimeout(function(){
									plusProgress.innerText = air.progress + " +";
									isBlocked = false;
								},300);
								if(air.progress === air.media.episodes){
									progress.innerText += " Completed";
									if(air.status === "REWATCHING"){//don't overwrite the existing end date
										authAPIcall(
											`mutation($progress: Int,$id: Int){
												SaveMediaListEntry(progress: $progress,id:$id,status:COMPLETED){id}
											}`,
											{id: air.id,progress: air.progress},
											data => {}
										);
									}
									else{
										authAPIcall(
											`mutation($progress: Int,$id: Int,$date:FuzzyDateInput){
												SaveMediaListEntry(progress: $progress,id:$id,status:COMPLETED,completedAt:$date){id}
											}`,
											{
												id: air.id,
												progress: air.progress,
												date: {
													year: (new Date()).getUTCFullYear(),
													month: (new Date()).getUTCMonth() + 1,
													day: (new Date()).getUTCDate(),
												}
											},
											data => {}
										);
									}
								}
								else{
									authAPIcall(
										`mutation($progress: Int,$id: Int){
											SaveMediaListEntry(progress: $progress,id:$id){id}
										}`,
										{id: air.id,progress: air.progress},
										data => {}
									);
								}
								localStorage.setItem("hohListPreview",JSON.stringify(data));
							}
						}
						else{
							air.progress++;
							plusProgress.innerText = air.progress + " +";
							progress.innerText = "Progress: " + air.progress;
							isBlocked = true;
							setTimeout(function(){
								plusProgress.innerText = air.progress + " +";
								progress.innerText = "Progress: " + air.progress;
								isBlocked = false;
							},300);
							authAPIcall(
								`mutation($progress: Int,$id: Int){
									SaveMediaListEntry(progress: $progress,id:$id){id}
								}`,
								{id: air.id,progress: air.progress},
								data => {}
							);
							localStorage.setItem("hohListPreview",JSON.stringify(data));
						}
						if(air.media.nextAiringEpisode){
							if(air.progress === air.media.nextAiringEpisode.episode - 1){
								if(card.querySelector(".behind-accent")){
									card.querySelector(".behind-accent").remove()
								}
							}
						}
						e.stopPropagation();
						e.preventDefault();
						return false
					}
					let fallback = create("span","hohFallback",air.media.title.userPreferred,card,"background-color: rgb(var(--color-foreground),0.6);padding: 3px;border-radius: 3px;");
					if(useScripts.titleLanguage === "ROMAJI"){
						fallback.innerText = air.media.title.userPreferred
					}
					
				})
			};
			if(airingImportant > 3){
				drawSection(
					airing.slice(0,airingImportant),translate("$preview_airingSection_title"),true
				);
				drawSection(
					notAiring.slice(0,5*Math.ceil((useScripts.previewMaxRows*5 - airingImportant)/5)),translate("$preview_animeSection_title")
				)
			}
			else{
				let remainderAiring = airing.slice(0,airingImportant).filter(air => air.index >= useScripts.previewMaxRows*5);
				drawSection(mediaLists.slice(0,useScripts.previewMaxRows*5 - remainderAiring.length).concat(remainderAiring),translate("$preview_animeSection_title"),true)
			}
		}
	}catch(e){errorHandler(e)}}
	authAPIcall(
		`query($name: String){
			Page(page:1){
				mediaList(type:ANIME,status_in:[CURRENT,REPEATING],userName:$name,sort:UPDATED_TIME_DESC){
					id
					priority
					scoreRaw: score(format: POINT_100)
					progress
					status
					media{
						id
						episodes
						coverImage{large color}
						title{userPreferred}
						nextAiringEpisode{episode timeUntilAiring}
					}
				}
			}
		}`,{name: whoAmI},function(data){
			localStorage.setItem("hohListPreview",JSON.stringify(data));
			buildPreview(data,true)
		}
	);
	buildPreview(JSON.parse(localStorage.getItem("hohListPreview")),false);
	}
	catch(e){
		errorHandler(e)
	}
}
//end modules/betterListPreview.js
//begin modules/betterReviewRatings.js
function betterReviewRatings(){
	if(!location.pathname.match(/\/home/)){
		return
	}
	let reviews = document.querySelectorAll(".review-card .el-tooltip.votes");
	if(!reviews.length){
		setTimeout(betterReviewRatings,500);
		return;
	}
	// Basic idea: read the rating info from the tooltips to avoid an API call.
	document.body.classList.add("TMPreviewScore");//add a temporary class, which makes all tooltips
	reviews.forEach(likeElement => {//trigger creation of the tooltips (they don't exist before hover)
		likeElement.dispatchEvent(new Event("mouseenter"));
		likeElement.dispatchEvent(new Event("mouseleave"));
		//bonus: add some alias and localisation
		let showId;
		if(likeElement.parentNode.previousElementSibling && likeElement.parentNode.previousElementSibling.classList.contains("banner")){//unreliable: they load separately. But better than nothing
			let possibleRefId = likeElement.parentNode.previousElementSibling.style.backgroundImage.match(/banner\/n?(\d+)-/);
			if(possibleRefId){
				showId = parseInt(possibleRefId[1])
			}
		}
		if(useScripts.partialLocalisationLanguage !== "English" || aliases.has(showId)){
			let elements = likeElement.previousElementSibling.previousElementSibling.textContent.match(/Review of (.+) by (.+)$/);
			if(elements){
				likeElement.previousElementSibling.previousElementSibling.childNodes[0].textContent
					= translate(
						"$review_reviewTitle",[
							titlePicker({id: showId, title: {romaji: elements[1]}}),
							elements[2]
						]
					)
			}
		}
	});
	setTimeout(function(){//give anilist some time to generate them
		reviews.forEach(likeElement => {
			let likeExtra = document.getElementById(likeElement.attributes["aria-describedby"].value);
			if(likeExtra){
				let matches = likeExtra.innerText.match(/(\d+) out of (\d+)/);
				if(matches){
					likeElement.childNodes[1].textContent += "/" + matches[2];
					if(useScripts.additionalTranslation){
						likeExtra.childNodes[0].textContent = translate("$reviewLike_tooltip",[matches[1],matches[2]])
					}
				}
			}
			likeElement.style.bottom = "4px";
			likeElement.style.right = "7px";
		})
		document.body.classList.remove("TMPreviewScore");//make tooltips visible again
	},200);
}
//end modules/betterReviewRatings.js
//begin modules/browseSubmenu.js
if(useScripts.browseSubmenu && useScripts.CSSverticalNav && whoAmI && !useScripts.mobileFriendly){
	let addMouseover = function(){
		let navThingy = document.querySelector(`.nav .links .browse-wrap`);
		if(navThingy){
			navThingy.classList.add("subMenuContainer");
			let subMenu = create("div","hohSubMenu",false,navThingy);

			[
				{
					text: "$submenu_anime",
					href: "/search/anime",
					vue: { name: 'Search', params: {type:'anime'}}
				},
				{
					text: "$submenu_manga",
					href: "/search/manga",
					vue: { name: 'Search', params: {type:'manga'}}
				},
				{
					text: "$submenu_staff",
					href: "/search/staff",
					vue: { name: 'Search', params: {type:'staff'}}
				},
				{
					text: "$submenu_characters",
					href: "/search/characters",
					vue: { name: 'Search', params: {type:'characters'}}
				},
				{
					text: "$submenu_reviews",
					href: "/reviews",
					vue: { name: 'Reviews'}
				},
				{
					text: "$submenu_recommendations",
					href: "/recommendations",
					vue: { name: 'Recommendations'}
				}
			].forEach(link => {
				let element = create("a","hohSubMenuLink",translate(link.text),subMenu);
				element.href = link.href;
				if(link.vue){
					element.onclick = function(){
						try{
							document.getElementById('app').__vue__._router.push(link.vue);
							return false
						}
						catch(e){
							console.warn("vue routes are outdated!")
						}
					}
				}
			})
			navThingy.onmouseenter = function(){
				subMenu.style.display = "inline"
			}
			navThingy.onmouseleave = function(){
				subMenu.style.display = "none"
			}
		}
		else{
			setTimeout(addMouseover,500)
		}
	};addMouseover()
}
//end modules/browseSubmenu.js
//begin modules/cencorMediaPage.js
function cencorMediaPage(id){
	if(!location.pathname.match(/^\/(anime|manga)/)){
		return
	}
	let possibleLocation = document.querySelectorAll(".tags .tag .name");
	if(possibleLocation.length){
		if(possibleLocation.some(
			tag => badTags.some(
				bad => tag.innerText.toLowerCase().includes(bad)
			)
		)){
			let content = document.querySelector(".page-content");
			if(content){
				content.classList.add("hohCencor")
			}
		}
	}
	else{
		setTimeout(() => {cencorMediaPage(id)},200)
	}
}
//end modules/cencorMediaPage.js
//begin modules/character.js
exportModule({
	id: "characterFavouriteCount",
	description: "Add an exact favourite count to character pages",
	isDefault: true,
	categories: ["Media"],
	visible: false,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/character(\/.*)?/.test(url)
	},
	code: async function(){
		const charWrap = document.querySelector(".character");
		const favWrap = charWrap.querySelector(".favourite") || await watchElem(".favourite", charWrap);
		const favCount = favWrap.querySelector(".count") || await watchElem(".count", favWrap);
		if(!favCount){
			return;
		}
		if(!isNaN(favCount.textContent)){
			return; // abort early since the site already displays exact fav count if under 1000
		}
		const favCallback = function(data){
			favWrap.onclick = function(){
				if(favWrap.classList.contains("isFavourite")){
					favCount.textContent = parseInt(favCount.textContent) - 1;
				}
				else{
					favCount.textContent = parseInt(favCount.textContent) + 1;
				}
			};
			if(data.Character.favourites){
				favCount.textContent = data.Character.favourites;
			}
		};
		const query = `query($id: Int!){
			Character(id: $id){
				favourites
			}
		}`;
		const variables = {id: parseInt(location.pathname.match(/\/character\/(\d+)\/?/)[1])};
		const {data, errors} = await anilistAPI(query, {
			variables,
			cacheKey: "hohCharacterFavs" + variables.id,
			duration: 60*60*1000
		});
		if(errors){
			return;
		}
		return favCallback(data);
	}
})
//end modules/character.js
//begin modules/characterBrowse.js
exportModule({
	id: "characterBrowseFavouriteCount",
	description: "Add favourite counts to character browse pages",
	isDefault: true,
	categories: ["Browse"],
	visible: false,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/search\/characters\/?(favorites)?$/.test(url)
	},
	code: function(){
		let pageCount = 0;
		let perPage = 30;
		const query = `
query($page: Int!,$perPage: Int!){
	Page(page: $page,perPage: $perPage){
		characters(sort: [FAVOURITES_DESC]){
			id
			favourites
		}
	}
}`;
		const results = document.querySelector(".landing-section.characters > .results, .results.cover");
		let charCount = results.childElementCount;

		const insertFavs = function(data){
			const chars = data.Page.characters;
			chars.forEach((character,index) => create(
				"span",
				"hohFavCountBrowse",
				character.favourites,
				results.children[(pageCount - 1)*chars.length + index]
			).title = translate("$characterBrowseTooltip"));
		}

		const getFavs = async function(){
			pageCount++
			const {data, errors} = await anilistAPI(query, {
				variables: {page: pageCount, perPage}
			})
			if(errors){
				return;
			}
			return insertFavs(data);
		}

		if(!/\/search\/characters\/?$/.test(location.pathname)){ // full favorites page
			perPage = 20;
			new MutationObserver((_mutations) => {
				if(results.childElementCount !== charCount && results.childElementCount % 20 === 0){
					charCount = results.childElementCount;
					getFavs();
				}
			}).observe(results, { subtree: true, childList: true })
		}

		getFavs();
	},
	css: `
.hohFavCountBrowse{
	color: rgb(var(--color-text-lighter));
	position: absolute;
	right: 2px;
	font-size: 60%;
	opacity: 0.7;
	top: -10px;
}`
})
//end modules/characterBrowse.js
//begin modules/clickableActivityHistory.js
exportModule({
	id: "clickableActivityHistory",
	description: "Displays activities for an entry in the activity history",
	isDefault: true,
	categories: ["Navigation","Profiles"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url.match(/\/user\/[^/]+\/?$/);
	},
	code: function(){
		if(!useScripts.termsFeed){
			return
		}
		let waiter = function(){
			let activityHistory = document.querySelector(".activity-history");
			if(!activityHistory){
				setTimeout(waiter,1000);
				return
			}
			activityHistory.onclick = function(event){
				let target = event.target;
				if(target && target.classList.contains("history-day")){
					if(target.classList.contains("lv-0")){
						return
					}
					let offset = 1;
					while(target.nextSibling){
						offset++;
						target = target.nextSibling
					}
					let presentDayPresentTime = (new Date()).valueOf();
					presentDayPresentTime = new Date(presentDayPresentTime.valueOf() - offset * 24*60*60*1000);
					let year = presentDayPresentTime.getUTCFullYear();
					let month = presentDayPresentTime.getUTCMonth() + 1;
					let day = presentDayPresentTime.getUTCDate();
					let hour = presentDayPresentTime.getUTCHours();
					if(hour + 9 > 23){
						day++
					}
					window.location.href = "https://anilist.co/terms?user=" + encodeURIComponent(document.querySelector("h1.name").innerText) + "&date=" + year + "-" + month + "-" + day
				}
			}
		};waiter()
	}
})
//end modules/clickableActivityHistory.js
//begin modules/directEditorAccess.js
exportModule({
	id: "directListAccess",
	description: "$directListAccess_description",
	extendedDescription: "$directListAccess_extendedDescription",
	isDefault: false,
	importance: 0,
	categories: ["Feeds"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url === "https://anilist.co/home" || url.match(/^https:\/\/anilist\.co\/user\/(.*)\/$/)
	},
	code: function(){
		let adder = function(){
			if(document.querySelector(".activity-feed")){
				document.querySelector(".activity-feed").addEventListener("click",function(e){
					let tmp_target = e.target;
					if(!tmp_target.classList.contains("el-dropdown-menu__item--divided")){
						for(let i=0;i<4;i++){
							if(tmp_target.classList.contains("entry-dropdown")){
								let item = document.getElementById(tmp_target.children[0].getAttribute("aria-controls"));
								if(item){
									item.querySelector(".el-dropdown-menu__item--divided").click();
									item.hidden = true
								}
								break
							}
							else{
								tmp_target = tmp_target.parentNode
							}
						}
					}
				})
			}
			else{
				setTimeout(adder,2000)
			}
		};
		adder()
	}
})
//end modules/directEditorAccess.js
//begin modules/documentTitleManager.js
let mutated = false;

let titleObserver = new MutationObserver(mutations => {
	if(mutated){
		mutated = false;
		return
	}
	let title = document.querySelector("head > title").textContent;
	let titleMatch = title.match(/(.*)\s\((\d+)\)\s\((.*)\s\(\2\)\)(.*)/);//ugly nested paranthesis like "Tetsuwan Atom (1980) (Astro Boy (1980)) · AniList"
	if(titleMatch){
		//change to the form "Tetsuwan Atom (Astro Boy 1980) · AniList"
		document.title = titleMatch[1] + " (" + titleMatch[3] + " " + titleMatch[2] + ")" + titleMatch[4];
		mutated = true
	}
	let badApostropheMatch = title.match(/^(\S+?s)'s\sprofile(.*)/);
	if(badApostropheMatch){
		document.title = badApostropheMatch[1] + "' profile" + badApostropheMatch[2];
		mutated = true
	}
	let name = title.match(/^(\S+?)'s\sprofile(.*)/);
	if(name && useScripts.partialLocalisationLanguage !== "English" && translate("$profile_title","") !== "'s profile"){
		document.title = translate("$profile_title",name[1]);
		mutated = true
	}
	if(useScripts.additionalTranslation){
		[
["Home · AniList","$documentTitle_home"],
["Notifications · AniList","$documentTitle_notifications"],
["Forum - Anime & Manga Discussion · AniList","$documentTitle_forum"],
["App Settings · AniList","$documentTitle_appSettings"]
		].forEach(pair => {
			if(title === pair[0]){
				let translation = translate(pair[1]);
				if(translation !== pair[0]){
					document.title = translation
				}
			}
		})
	}
	if(useScripts.SFWmode && title !== "Table of Contents"){//innocent looking
		document.title = "Table of Contents";
		mutated = true
	}
});
if(document.title){
	titleObserver.observe(document.querySelector("head > title"),{subtree: true, characterData: true, childList: true })
}
//end modules/documentTitleManager.js
//begin modules/dubMarker.js
function dubMarker(){
	if(!document.URL.match(/^https:\/\/anilist\.co\/anime\/.*/)){
		return
	}
	if(document.getElementById("dubNotice")){
		return
	}
	const variables = {
		id: document.URL.match(/\/anime\/(\d+)\//)[1],
		page: 1,
		language: useScripts.dubMarkerLanguage.toUpperCase()
	};
	const query = `
query($id: Int!, $type: MediaType, $page: Int = 1, $language: StaffLanguage){
	Media(id: $id, type: $type){
		characters(page: $page, sort: [ROLE], role: MAIN){
			edges {
				node{id}
				voiceActors(language: $language){language}
			}
		}
	}
}`;
	let dubCallback = function(data){
		if(!document.URL.match(/^https:\/\/anilist\.co\/anime\/.*/)){
			return
		}
		let dubNoticeLocation = document.querySelector(".sidebar");
		if(!dubNoticeLocation){
			setTimeout(function(){
				dubCallback(data)
			},200);
			return
		}
		if(data.data.Media.characters.edges.reduce(
			(actors,a) => actors + a.voiceActors.length,0
		)){//any voice actors for this language?
			if(document.getElementById("dubNotice")){
				return
			}
			let dubNotice = create("p","#dubNotice",
				translate("$dubMarker_notice",translate("$language_" + useScripts.dubMarkerLanguage))
			);
			dubNoticeLocation.insertBefore(dubNotice,dubNoticeLocation.firstChild)
		}
	};
	generalAPIcall(query,variables,dubCallback,"hohDubInfo" + variables.id + variables.language)
}
//end modules/dubMarker.js
//begin modules/durationTooltip.js
exportModule({
	id: "durationTooltip",
	description: "Adds media duration as a tooltip",
	isDefault: true,
	importance: -2,
	categories: ["Media"],//what categories your module belongs in
	visible: false,//trivial, can be turned on
	urlMatch: function(url,oldUrl){
		let urlStuff = url.match(/\/anime\/(\d+)\//);
		if(urlStuff){
			let urlStuff2 = oldUrl.match(/\/anime\/(\d+)\//);
			if(urlStuff2 && urlStuff[1] === urlStuff2[1]){
				return false
			}
			return true
		}
		return false
	},
	code: function(){
		let specials = {
			"721": "total 10 hours 38 minutes (13x25min, 24x12min + 1x25min)"//tutu
		};
		let waiter = function(){
			let urlStuff = document.URL.match(/\/anime\/(\d+)\//);
			if(!urlStuff){
				return
			}
			let side = document.querySelector(".sidebar > .data");
			if(!side){
				setTimeout(waiter,1000);
				return
			}
			let eps = null;
			let dur = null;
			let anchor = null;
			if(document.querySelector(".hohHasDurationTooltip")){
				document.querySelector(".hohHasDurationTooltip").title = ""
			}
			try{
				let found = false
				Array.from(side.children).forEach(child => {
					if(child.querySelector(".type")){
						if(["Episodes",translate("$dataSet_episodes")].includes(child.querySelector(".type").innerText)){
							eps = parseInt(child.querySelector(".value").innerText)
						}
						else if(["Duration","Episode Duration",translate("$dataSet_episodeDuration"),translate("$dataSet_duration")].includes(child.querySelector(".type").innerText)){
							anchor = child.querySelector(".value");
							found = true;
							let hours = parseInt((anchor.innerText.match(/(\d+) hours?/) || [null,"0"])[1]);
							let minutes = parseInt((anchor.innerText.match(/(\d+) mins?/) || [null,"0"])[1]);
							dur = hours * 60 + minutes
						}
					}
				})
				if(!found){
					setTimeout(waiter,1000);
					return
				}
				if(anchor && eps && dur){
					if(specials[urlStuff[1]]){
						anchor.title = specials[urlStuff[1]];
					}
					else{
						anchor.title = "total " + formatTime(eps*dur*60,"twoPart");
					}
					anchor.classList.add("hohHasDurationTooltip")
				}
			}
			catch(e){
				console.warn("failed to parse duration info")
			}
		};waiter()
	},
})
//end modules/durationTooltip.js
//begin modules/embedHentai.js
function embedHentai(){
	if(!document.URL.match(/^https:\/\/anilist\.co\/(home|user|forum|activity)/)){
		return
	}
	if(useScripts.SFWmode){//saved you there
		return
	}
	setTimeout(embedHentai,1000);
	let mediaEmbeds = document.querySelectorAll(".media-embed");
	let bigQuery = [];//collects all on a page first so we only have to send 1 API query.
	mediaEmbeds.forEach(function(embed){
		if(embed.children.length === 0 && !embed.classList.contains("hohMediaEmbed")){//if( "not-rendered-natively" && "not-rendered-by-this sript" )
			embed.classList.add("hohMediaEmbed");
			let createEmbed = function(data){
				if(!data){
					return
				}
				embed.innerText = "";
				let eContainer = create("div",false,false,embed);
				let eEmbed = create("div","embed",false,eContainer);
				let eCover = create("div","cover",false,eEmbed);
				if(data.data.Media.coverImage.color){
					eCover.style.backgroundColor = data.data.Media.coverImage.color
				}
				eCover.style.backgroundImage = "url(" + data.data.Media.coverImage.large + ")";
				let eWrap = create("div","wrap",false,eEmbed);
				let mediaTitle = titlePicker(data.data.Media);
				let eTitle = create("div","title",mediaTitle,eWrap);
				let eInfo = create("div","info",false,eWrap);
				let eGenres = create("div","genres",false,eInfo);
				data.data.Media.genres.forEach((genre,index) => {
					let eGenre = create("span",false,genre,eGenres);
					let comma = create("span",false,", ",eGenre);
					if(index === data.data.Media.genres.length - 1){
						comma.style.display = "none"
					}
				});
				create("span",false,distributionFormats[data.data.Media.format],eInfo);
				create("span",false," · " + distributionStatus[data.data.Media.status],eInfo);
				if(data.data.Media.season){
					create("span",false,
						" · " + capitalize(data.data.Media.season.toLowerCase()) + " " + data.data.Media.startDate.year,
						eInfo
					)
				}
				else if(data.data.Media.startDate.year){
					create("span",false,
						" · " + data.data.Media.startDate.year,
						eInfo
					)
				}
				if(data.data.Media.averageScore){
					create("span",false," · " + data.data.Media.averageScore + "%",eInfo)
				}
				else if(data.data.Media.meanScore){//fallback if it's not popular enough, better than nothing
					create("span",false," · " + data.data.Media.meanScore + "%",eInfo)
				}
			}
			bigQuery.push({
				query: "query($mediaId:Int,$type:MediaType){Media(id:$mediaId,type:$type){id title{romaji native english} coverImage{large color} genres format status season meanScore averageScore startDate{year}}}",
				variables: {
					mediaId: +embed.dataset.mediaId,
					type: embed.dataset.mediaType.toUpperCase()
				},
				callback: createEmbed,
				cacheKey: "hohMedia" + embed.dataset.mediaId
			})
		}
	});
	queryPacker(bigQuery);
}
//end modules/embedHentai.js
//begin modules/enumerateSubmissionStaff.js
exportModule({
	id: "enumerateSubmissionStaff",
	description: "$enumerateSubmissionStaff_description",
	isDefault: true,
	categories: [/*"Submissions",*/"Profiles"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/edit/)
	},
	code: function enumerateSubmissionStaff(){
		if(!location.pathname.match(/^\/edit/)){
			return
		}
		setTimeout(enumerateSubmissionStaff,500);
		let staffFound = [];
		let staffEntries = document.querySelectorAll(".staff-row .col > .image");
		Array.from(staffEntries).forEach(function(staff){
			let enumerate = staffFound.filter(a => a === staff.href).length;
			if(enumerate === 1){
				let firstStaff = document.querySelector(".staff-row .col > .image[href=\"" + staff.href.replace("https://anilist.co","") + "\"]");
				if(!firstStaff.previousSibling){
					firstStaff.parentNode.insertBefore(
						create("span","hohEnumerateStaff",1),
						firstStaff
					)
				}
			}
			if(enumerate > 0){
				if(staff.previousSibling){
					staff.previousSibling.innerText = enumerate + 1;
				}
				else{
					staff.parentNode.insertBefore(
						create("span","hohEnumerateStaff",(enumerate + 1)),
						staff
					)
				}
			}
			staffFound.push(staff.href);
		})
	}
})
//end modules/enumerateSubmissionStaff.js
//begin modules/expandDescriptions.js
exportModule({
	id: "expandDescriptions",
	description: "$expandDescriptions_description",
	isDefault: true,
	categories: ["Media"],
	visible: true
})
//end modules/expandDescriptions.js
//begin modules/expandFeedFilters.js
exportModule({
	id: "CSSexpandFeedFilters",
	description: "$CSSexpandFeedFilters_description",
	isDefault: true,
	categories: ["Feeds"],
	visible: true
})
//end modules/expandFeedFilters.js
//begin modules/expandRight.js
function expandRight(){
	if(!location.pathname.match(/^\/home\/?$/)){
		return
	}
	let possibleFullWidth = document.querySelector(".home.full-width");
	if(possibleFullWidth){
		let homeContainer = possibleFullWidth.parentNode;
		let sideBar = document.querySelector(".activity-feed-wrap")
		if(!sideBar){
			setTimeout(expandRight,100);
			return;
		}
		sideBar = sideBar.nextElementSibling;
		sideBar.insertBefore(possibleFullWidth,sideBar.firstChild);
		let setSemantics = function(){
			let toggle = document.querySelector(".size-toggle.fa-compress");
			if(toggle){
				toggle.onclick = function(){
					homeContainer.insertBefore(possibleFullWidth,homeContainer.firstChild)
				}
			}
			else{
				setTimeout(setSemantics,200)
			}
		};setSemantics();
	}
}
//end modules/expandRight.js
//begin modules/expandedListNotes.js
exportModule({
	id: "expandedListNotes",
	description: "$expandedListNotes_description",
	extendedDescription: "$expandedListNotes_extendedDescription",
	isDefault: true,
	importance: 0,
	categories: ["Lists"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/.+\/(anime|manga)list\/?(.*)?$/)
	},
	code: function(){
		let clickHandler = function(){
			let URLstuff = document.URL.match(/^https:\/\/anilist\.co\/user\/(.+)\/(anime|manga)list\/?/);
			let name = decodeURIComponent(URLstuff[1]);
			Array.from(document.querySelectorAll(".list-entries .notes")).forEach(note => {
				note.onclick = function(){
					//getting the title is tricky since the layouts vary
					let title_element = note.parentNode.querySelector(".title a");
					let id = title_element.href.match(/(anime|manga)\/(\d+)\//)[2];
					let title = titlePicker({//hack: pretend we have all this fancy API info
						title: {
							native: title_element.innerText,
							romaji: title_element.innerText,
							english: title_element.innerText
						},
						id: id
					});
					let floatyWindowThingy = createDisplayBox("min-width:500px;min-height:300px;",title);
					floatyWindowThingy.style.maxWidth = "80ch";
					floatyWindowThingy.style.lineHeight = "1.4";
					floatyWindowThingy.style.marginRight = "12px";
					create("p",false,note.getAttribute("label"),floatyWindowThingy,"margin-bottom: 30px;margin-top: 10px;background: rgb(var(--color-background));padding: 10px;border-radius: 5px;");
					//fancy stuff: find activities with replies
					generalAPIcall(
						"query($name:String){User(name:$name){id}}",
						{name: name},
						function(nameData){generalAPIcall(`
							query{
								Page{
									activities(userId: ${nameData.data.User.id},mediaId: ${id}, sort: ID_DESC){
										... on ListActivity{
											status
											progress
											siteUrl
											createdAt
											replies{
												user{name}
												text(asHtml: true)
											}
										}
									}
								}
							}`,
							{},
							function(data){
								data.data.Page.activities.forEach(activity => {
									create("hr",false,false,floatyWindowThingy);
									let activityEntry = create("div","hohTimelineEntry",false,floatyWindowThingy);
									let activityContext = create("a","newTab",capitalize(activity.status),activityEntry);
									activityContext.href = activity.siteUrl;
									if(["watched episode","read chapter","rewatched episode","reread chapter"].includes(activity.status)){
										activityContext.innerText += " " + activity.progress
									}
									create("span",false,
										" " + (new Date(activity.createdAt*1000)).toDateString(),
										activityEntry,
										"position:absolute;right:7px;"
									).title = (new Date(activity.createdAt*1000)).toLocaleString()
									if(activity.replies.length){
										let activityReplies = create("div",["hohTimelineEntry","replies"],false,floatyWindowThingy,"margin-left: 30px;");
										activity.replies.forEach(reply => {
											let reply_container = create("div","reply",false,activityReplies,"padding: 10px;margin: 2px;border-radius: 5px;background: rgb(var(--color-background));");
											create("span","name",reply.user.name + ": ",reply_container);
											let text = create("span",false,false,reply_container);
											text.innerHTML = DOMPurify.sanitize(reply.text)//reason for inner HTML: preparsed sanitized HTML from the Anilist API
										})
									}
								})
							}
						)},
						"hohIDlookup" + name.toLowerCase()
					)
				}
			})
			setTimeout(function(){
				if(document.URL.match(/^https:\/\/anilist\.co\/.+\/(anime|manga)list\/?(.*)?$/)){
					clickHandler()
				}
			},2000)
		};
		clickHandler()
	},
	css: ".list-entries .entry-card .notes{cursor: pointer}"
})
//end modules/expandedListNotes.js
//begin modules/extraDefaultSorts.js
exportModule({
	id: "extraDefaultSorts",
	description: "$extraDefaultSorts_description",
	extendedDescription: "$extraDefaultSorts_extendedDescription",
	isDefault: true,
	importance: 0,
	categories: ["Lists","Newly Added"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/\/user\/.*\/(anime|manga)list/) || url === "https://anilist.co/settings/lists"
	},
	code: function(){
		if(document.URL === "https://anilist.co/settings/lists"){
			let optionsAdder = function(){
				if(document.URL !== "https://anilist.co/settings/lists"){
					return
				}
				let selector = document.querySelector('input[placeholder="Default List Order"]');
				if(!selector){
					setTimeout(optionsAdder,500);
					return
				}
				if(useScripts.customDefaultListOrder){
					selector.value = useScripts.customDefaultListOrder
				}
				selector.onclick = function(){
					let findDropdown = function(){
						if(document.URL !== "https://anilist.co/settings/lists"){
							return
						}
						let dropdowns = document.querySelectorAll(".el-select-dropdown");
						let correctDropdownFound = true;
						Array.from(dropdowns).forEach(dropdown => {
							if(dropdown.textContent === "ScoreTitleLast UpdatedLast Added"){//will break when more defaults are added. That's intentional
								correctDropdownFound = true;
								let ul = dropdown.querySelector("ul");
								let nativeOrder = "";
								let nativeIndex = 0;
								Array.from(ul.children).forEach((child,index) => {
									child.style.display = "none";
									if(child.classList.contains("selected")){
										nativeOrder = child.textContent;
										nativeIndex = index
									}
								});
								[
{
	name: "Title",
	native: true,
	nativeIndex: 1
},
{
	name: "Score",
	native: true,
	nativeIndex: 0
},
{
	name: "Progress"
},
{
	name: "Last Updated",
	native: true,
	nativeIndex: 2
},
{
	name: "Last Added",
	native: true,
	nativeIndex: 3
},
{
	name: "Start Date"
},
{
	name: "Completed Date"
},
{
	name: "Release Date"
},
{
	name: "Average Score"
},
{
	name: "Popularity"
}
								].forEach(option => {
									let element = create("li","el-select-dropdown__item",false,ul);
									let elementSpan = create("span",false,option.name,element);
									if(
										option.name === useScripts.customDefaultListOrder
										|| (useScripts.customDefaultListOrder === "" && option.name === nativeOrder)
									){
										element.classList.add("selected")
										element.classList.add("hohSelected")
									}
									element.onclick = function(){
										if(option.native){
											nativeOrder = option.name;
											nativeIndex = option.nativeIndex;
											useScripts.customDefaultListOrder = "";
											selector.value = option.name;
											useScripts.save()
										}
										else{
											useScripts.customDefaultListOrder = option.name;
											selector.value = useScripts.customDefaultListOrder;
											useScripts.save()
										}
										let badSelected = ul.querySelector(".hohSelected");
										badSelected.classList.remove("selected");
										badSelected.classList.remove("hohSelected");
										element.classList.add("selected");
										element.classList.add("hohSelected");
										ul.children[nativeIndex].click()
									}
								})
							}
						})
						if(!correctDropdownFound){
							setTimeout(findDropdown,200)
						}
					};findDropdown()
				}
			};optionsAdder()
		}
		else{
			if(useScripts.customDefaultListOrder === ""){
				return
			}
			let optionsAdder = function(){
				const URLstuff = location.pathname.match(/^\/user\/(.+)\/(animelist|mangalist)/);
				if(!URLstuff){
					return
				}
				if(decodeURIComponent(URLstuff[1]) !== whoAmI){
					return
				}
				let selector = document.querySelector('input[placeholder="Sort"]');
				if(!selector){
					setTimeout(optionsAdder,200);
					return
				}
				if(selector.classList.contains("hohCustomSelected")){
					return
				}
				selector.click();
				selector.classList.add("hohCustomSelected");
				let findDropdown = function(){
					if(!location.pathname.match(/^\/user\/(.+)\/(animelist|mangalist)/)){
						return
					}
					let dropdowns = document.querySelectorAll(".el-select-dropdown");
					let correctDropdownFound = true;
					Array.from(dropdowns).forEach(dropdown => {
						if(dropdown.textContent === "TitleScoreProgressLast UpdatedLast AddedStart DateCompleted DateRelease DateAverage ScorePopularity"){
							correctDropdownFound = true;
							let ul = dropdown.querySelector("ul");
							Array.from(ul.children).forEach((child,index) => {
								if(child.textContent === useScripts.customDefaultListOrder){
									child.click()
								}
							})
						}
					})
					if(!correctDropdownFound){
						setTimeout(findDropdown,200)
					}
				};findDropdown()
			};optionsAdder()
		}
	}
})
//end modules/extraDefaultSorts.js
//begin modules/extraFavs.js
exportModule({
	id: "extraFavs",
	description: "$extraFavs_description",
	isDefault: true,
	importance: 0,
	categories: ["Profiles"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/user\/(.*?)\/?$/)
	},
	code: function(){
		let finder = function(){
			const URLstuff = document.URL.match(/^https:\/\/anilist\.co\/user\/(.*?)\/?$/);
			if(!URLstuff){
				return
			}
			const favSection = document.querySelector(".favourites-wrap.anime");
			if(!favSection){
				setTimeout(finder,1000);
				return
			}
			if(favSection.classList.contains("hohExtraFavs")){
				if(favSection.dataset.user === decodeURIComponent(URLstuff[1])){
					return
				}
				else{
					Array.from(favSection.querySelectorAll(".hohExtraFav")).forEach(fav => fav.remove())
				}
			}
			favSection.dataset.user = decodeURIComponent(URLstuff[1]);
			if(favSection.children.length === 0){
				setTimeout(finder,1000);
				return
			}
			if(
				favSection.children.length < 25 //user has all favs on profile
				|| favSection.children.length > 25 //if I have messed up somehow
			){
				return
			}
			favSection.classList.add("hohExtraFavs");
			generalAPIcall(//private users will not be able to use this on themselves, funnily enough.
`
query($user: String!){
	User(name: $user){
		favourites{
			anime1:anime(page:2){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
			anime2:anime(page:3){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
			anime3:anime(page:4){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
		}
	}
}
`,//top 100 is enough in most cases
				{
					user: decodeURIComponent(URLstuff[1]),
				},
				function(data){
					favSection.style.maxHeight = (favSection.clientHeight || 615) + "px";
					if(!data){
						return//could be a private profile
					}
					let findTooltip = function(){
						let possibleTooltip = document.querySelector(".tooltip.visible.animate-position");
						if(
							!possibleTooltip
							|| !possibleTooltip.querySelector(".content")
						){
							let candidates = Array.from(document.querySelectorAll(".tooltip.animate-position")).filter(
								tooltip => tooltip.querySelector(".content") && !tooltip.innerText.match(/Manga$/)
							)
							if(candidates.length){
								possibleTooltip = candidates[0]
							}
						}
						return possibleTooltip
					}
					let elderText = null;
					let elderRestorer = function(){
						let possibleTooltip = findTooltip();
						if(possibleTooltip){
							possibleTooltip.children[0].childNodes[0].textContent = elderText.title;
							possibleTooltip.children[1].childNodes[0].textContent = elderText.extra;
							possibleTooltip.style.transform = elderText.position;
							elderText = null;
							possibleTooltip.style.pointerEvents = "none"
						}
					}
					data.data.User.favourites.anime1.nodes.concat(
						data.data.User.favourites.anime2.nodes
					).concat(
						data.data.User.favourites.anime3.nodes
					).forEach(fav => {
						let element = create("a",["favourite","media","hohExtraFav"],false,favSection,'background-image: url("' + fav.coverImage.large + '")');
						element.href = "/anime/" + fav.id + "/" + safeURL(titlePicker(fav));
						cheapReload(element,{path: element.pathname})
						element.onmouseover = function(){
							let possibleTooltip = findTooltip();
							if(possibleTooltip){
								possibleTooltip.classList.add("visible");
								if(!elderText){
									elderText = {
										title: possibleTooltip.children[0].childNodes[0].textContent,
										extra: possibleTooltip.children[1].childNodes[0].textContent,
										position: possibleTooltip.style.transform
									}
									possibleTooltip.addEventListener("mouseenter",elderRestorer,{once: true});
									possibleTooltip.style.pointerEvents = "unset"
								}
								possibleTooltip.children[0].childNodes[0].textContent = titlePicker(fav);
								possibleTooltip.children[1].childNodes[0].textContent = [fav.startDate ? (fav.startDate.year || "") : "", distributionFormats[fav.format] || ""].join(" ")
								let pos = element.getBoundingClientRect();
								let pos2 = possibleTooltip.getBoundingClientRect();
								let x_offset = Math.round(pos.left + window.scrollX - pos2.width/2 + pos.width/2);
								let y_offset = Math.round(pos.top + window.scrollY - pos2.height - 10);
								possibleTooltip.style.transform = "translate(" + x_offset + "px, " + y_offset + "px)"
							}
							else{
								element.title = titlePicker(fav)
							}
						}
						element.onmouseout = function(){
							let possibleTooltip = findTooltip();
							if(possibleTooltip){
								possibleTooltip.classList.remove("visible");
							}
						}
					})
				},
				"hohExtraFavs" + URLstuff[1],
				60*60*1000//cache for an hour
			)
		};finder()
		let finder2 = function(){
			const URLstuff = document.URL.match(/^https:\/\/anilist\.co\/user\/(.*?)\/?$/);
			if(!URLstuff){
				return
			}
			const favSection = document.querySelector(".favourites-wrap.manga");
			if(!favSection){
				setTimeout(finder2,1000);
				return
			}
			if(favSection.classList.contains("hohExtraFavs")){
				return
			}
			if(favSection.children.length === 0){
				setTimeout(finder2,1000);
				return
			}
			if(
				favSection.children.length < 25 //user has all favs on profile
				|| favSection.children.length > 25 //if I have messed up somehow
			){
				return
			}
			favSection.classList.add("hohExtraFavs");
			generalAPIcall(
`
query($user: String!){
	User(name: $user){
		favourites{
			manga1:manga(page:2){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
			manga2:manga(page:3){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
			manga3:manga(page:4){
				nodes{
					id
					coverImage{large}
					startDate{year}
					format
					title{romaji native english}
				}
			}
		}
	}
}
`,//top 100 is enough in most cases
				{
					user: decodeURIComponent(URLstuff[1]),
				},
				function(data){
					favSection.style.maxHeight = (favSection.clientHeight || 615) + "px";
					if(!data){
						return//could be a private profile
					}
					let findTooltip = function(){
						let possibleTooltip = document.querySelector(".tooltip.visible.animate-position");
						if(possibleTooltip.innerText.match(/(TV|Movie)$/)){
							possibleTooltip = null
						}
						if(
							!possibleTooltip
							|| !possibleTooltip.querySelector(".content")
						){
							let candidates = Array.from(document.querySelectorAll(".tooltip.animate-position")).filter(
								tooltip => tooltip.querySelector(".content") && !tooltip.innerText.match(/(TV|Movie)$/)
							)
							if(candidates.length){
								possibleTooltip = candidates[0]
							}
						}
						return possibleTooltip
					}
					let elderText = null;
					let elderRestorer = function(){
						let possibleTooltip = findTooltip();
						if(possibleTooltip){
							possibleTooltip.children[0].childNodes[0].textContent = elderText.title;
							possibleTooltip.children[1].childNodes[0].textContent = elderText.extra;
							possibleTooltip.style.transform = elderText.position;
							elderText = null;
							possibleTooltip.style.pointerEvents = "none"
						}
					}
					data.data.User.favourites.manga1.nodes.concat(
						data.data.User.favourites.manga2.nodes
					).concat(
						data.data.User.favourites.manga3.nodes
					).forEach(fav => {
						let element = create("a",["favourite","media","hohExtraFav"],false,favSection,'background-image: url("' + fav.coverImage.large + '")');
						element.href = "/manga/" + fav.id + "/" + safeURL(titlePicker(fav));
						cheapReload(element,{path: element.pathname})
						element.onmouseover = function(){
							let possibleTooltip = findTooltip();
							if(possibleTooltip){
								possibleTooltip.classList.add("visible");
								if(!elderText){
									elderText = {
										title: possibleTooltip.children[0].childNodes[0].textContent,
										extra: possibleTooltip.children[1].childNodes[0].textContent,
										position: possibleTooltip.style.transform
									}
									possibleTooltip.addEventListener("mouseenter",elderRestorer,{once: true});
									possibleTooltip.style.pointerEvents = "unset"
								}
								possibleTooltip.children[0].childNodes[0].textContent = titlePicker(fav);
								possibleTooltip.children[1].childNodes[0].textContent = [fav.startDate ? (fav.startDate.year || "") : "", distributionFormats[fav.format] || ""].join(" ")
								let pos = element.getBoundingClientRect();
								let pos2 = possibleTooltip.getBoundingClientRect();
								let x_offset = Math.round(pos.left + window.scrollX - pos2.width/2 + pos.width/2);
								let y_offset = Math.round(pos.top + window.scrollY - pos2.height - 10);
								possibleTooltip.style.transform = "translate(" + x_offset + "px, " + y_offset + "px)"
							}
							else{
								element.title = titlePicker(fav)
							}
						}
						element.onmouseout = function(){
							let possibleTooltip = findTooltip();
							if(possibleTooltip){
								possibleTooltip.classList.remove("visible");
							}
						}
					})
				},
				"hohExtraFavsManga" + URLstuff[1],
				60*60*1000//cache for an hour
			)
		};finder2()
	},
	css: `
.hohExtraFav{
	background-position: 50%;
	background-repeat: no-repeat;
	background-size: cover;
	border-radius: 4px;
	cursor: pointer;
	display: inline-block;
	height: 115px;
	position: relative;
	width: 85px;
	margin-bottom: 20px;
	margin-right: 21px;
}
.hohExtraFavs:hover{
	overflow-y: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;
}
.hohExtraFavs:hover::-webkit-scrollbar{
	width: 0;
	height: 0;
}
`
})
//end modules/extraFavs.js
//begin modules/feedListLikes.js
exportModule({
	id: "feedListLikes",
	description: "Add a full list of likes to feed posts",
	isDefault: true,
	categories: ["Feeds"],
	visible: false
})

let likeLoop = setInterval(function(){
	document.querySelectorAll(
		".activity-entry > .wrap > .actions .action.likes:not(.hohHandledLike)"
	).forEach(thingy => {
		thingy.classList.add("hohHandledLike");
		thingy.onmouseover = function(){
			if(!thingy.querySelector(".count")){
				return
			}
			let likeCount = parseInt(thingy.querySelector(".count").innerText) || 0;
			if(likeCount <= 5){
				return
			}
			if(thingy.classList.contains("hohLoadedLikes")){
				let dataSetCache = parseInt(thingy.dataset.cacheLikeCount);
				if(isNaN(dataSetCache)){//API query already in progress
					return
				}
				if(dataSetCache === likeCount){//nothing changed
					return
					//in theory, someone *could* have retracted a like, and someone else been added, but it doesn't really happen all that often.
					//at least, this is better than what was previously done, namely never refetching the data at all, even if the count changed
				}
			}
			thingy.classList.add("hohLoadedLikes");
			const id = parseInt(thingy.parentNode.parentNode.querySelector(`[href^="/activity/"`).href.match(/\d+/));
			generalAPIcall(`
query($id: Int){
	Activity(id: $id){
		... on TextActivity{
			likes{name}
		}
		... on MessageActivity{
			likes{name}
		}
		... on ListActivity{
			likes{name}
		}
	}
}`,
				{id: id},
				data => {
					thingy.title = data.data.Activity.likes.map(like => like.name).join("\n");
					thingy.dataset.cacheLikeCount = data.data.Activity.likes.length
				}
			)
		}
	});
},400);
//end modules/feedListLikes.js
//begin modules/filterStaffTabs.js
exportModule({
	id: "filterStaffTabs",
	description: "$filterStaffTabs_description",
	isDefault: true,
	categories: ["Media"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/(anime|manga)\/\d+\/.*\/staff/)
	},
	code: async function(){
		const mediaStaff = document.querySelector(".media-staff") || await watchElem(".media-staff");
		const staffGrid = mediaStaff.querySelector(".grid-wrap") || await watchElem(".grid-wrap",mediaStaff);
		if(staffGrid.children.length > 9){
			let filterBoxContainer = create("div","#hohStaffTabFilter");
			mediaStaff.prepend(filterBoxContainer);
			let filterRemover = create("span","#hohFilterRemover",svgAssets.cross,filterBoxContainer)
			let filterBox = create("input",false,false,filterBoxContainer);
			filterBox.placeholder = translate("$mediaStaff_filter");
			filterBox.setAttribute("list","staffRoles");
			let filterer = function(){
				let val = filterBox.value;
				Array.from(staffGrid.children).forEach(card => {
					if(
						looseMatcher(card.querySelector(".name").innerText,val)
						|| looseMatcher(card.querySelector(".role").innerText,val)
					){
						card.style.display = "inline-grid"
					}
					else{
						card.style.display = "none"
					}
				});
				if(val === ""){
					filterRemover.style.display = "none"
				}
				else{
					filterRemover.style.display = "inline"
				}
			}
			filterRemover.onclick = function(){
				filterBox.value = "";
				filterer()
			}
			filterBox.oninput = filterer;
			let dataList = create("datalist","#staffRoles",false,filterBoxContainer);
			let buildStaffRoles = function(){
				let autocomplete = new Set();
				Array.from(staffGrid.children).forEach(card => {
					autocomplete.add(card.querySelector(".name").innerText);
					autocomplete.add(card.querySelector(".role").innerText.replace(/\s*\(.*\)\.?\s*/,""));
					if(card.querySelector(".role").innerText.includes("OP")){
						autocomplete.add("OP")
					}
					if(card.querySelector(".role").innerText.includes("ED")){
						autocomplete.add("ED")
					}
				})
				removeChildren(dataList);
				autocomplete.forEach(
					value => create("option",false,false,dataList).value = value
				)
			};buildStaffRoles();
			let mutationConfig = {
				attributes: false,
				childList: true,
				subtree: false
			};
			let observer = new MutationObserver(function(){
				filterer();
				buildStaffRoles()
			});
			observer.observe(staffGrid,mutationConfig)
		}
	}
})
//end modules/filterStaffTabs.js
//begin modules/forumLikes.js
exportModule({
	id: "forumLikes",
	description: "$forumLikes_description",
	isDefault: true,
	categories: ["Forum"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return /^https:\/\/anilist\.co\/forum\/thread\/.*/.test(url)
	},
	code: function(){
		let URLstuff = location.pathname.match(/^\/forum\/thread\/(\d+)/);
		if(!URLstuff){
			return
		}
		let adder = function(data){
			if((!data) || (!location.pathname.includes("forum/thread/" + URLstuff[1]))){
				return
			}
			let button = document.querySelector(".footer .actions .like-wrap .button");
			if(!button){
				setTimeout(function(){adder(data)},200);
				return;
			}
			button.title = data.data.Thread.likes.map(like => like.name).join("\n");
		}
		generalAPIcall(`
			query($id: Int){
				Thread(id: $id){
					likes{name}
				}
			}`,
			{id: parseInt(URLstuff[1])},
			adder
		)
	}
})
//end modules/forumLikes.js
//begin modules/forumRecent.js
exportModule({
	id: "forumRecent",
	description: "$forumRecent_description",
	isDefault: false,
	categories: ["Forum","Navigation"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return false
	}
})

if(useScripts.forumRecent){
	let finder = function(){
		let navLinks = document.querySelector(`#nav .links .link[href="/forum/overview"]`);
		if(navLinks){
			navLinks.href = "/forum/recent";
			navLinks.onclick = function(){
				try{
					document.getElementById("app").__vue__._router.push({ name: "ForumFeed", params: {type: "recent"}});
					return false
				}
				catch(e){
					let forumRecentLink = navLinks.cloneNode(true);//copying and pasting the node should remove all event references to it
					navLinks.parentNode.replaceChild(forumRecentLink,navLinks);
				}
			}
		}
		else{
			setTimeout(finder,1000)
		}
	}
	finder()
}
//end modules/forumRecent.js
//begin modules/forumVisualLikes.js
exportModule({
	id: "forumVisualLikes",
	description: "Show more user avatars which liked a forum thread or comment",
	isDefault: true,
	categories: ["Forum"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return /^https:\/\/anilist\.co\/forum\/thread\/.*/.test(url)
	},
	code: function(){
		let likeLoop = setInterval(function(){
			// forum comments
			document.querySelectorAll(
				".forum-thread .comment .actions .like-wrap.thread_comment:not(.hohHandledLike)"
			).forEach(thingy => {
				thingy.classList.add("hohHandledLike");
				let updateLikes = function(){
					let idLink = thingy.parentNode.querySelector('.hidden[href^="/forum/thread/"]');
					if(!idLink){
						return
					}
					const id = parseInt(idLink.href.match(/\d+$/));
//wow, this API sucks!
					generalAPIcall(`
query($id: Int){
	ThreadComment(id:$id){
		id
		likes{
			name
			avatar{large}
		}
		childComments
	}
}`,
						{id: id},
						data => {
							if(!data){
								return
							}
							//TODO: be more efficient and update other comments too
							let seeker = function(comment){
								if(comment.id === id){
									let userList = thingy.querySelector(".users");
									let waitForAnilist = function(tries){
										tries--;
										if(!userList.children.length && tries){
											setTimeout(function(){waitForAnilist(tries)},200);
											return
										}
										for(let i=5;i<comment.likes.length;i++){
											let newEle = userList.children[0].cloneNode();//to be up to date with those random attributes
											newEle.href = "/user/" + comment.likes[i].name + "/";
											newEle.style.backgroundImage = 'url("' + comment.likes[i].avatar.large + '")';
											userList.appendChild(newEle)
										}
									};waitForAnilist(20);
									return true
								}
								else if(comment.childComments){
									for(let i=0;i<comment.childComments.length;i++){
										if(seeker(comment.childComments[i])){
											return true
										}
									}
								}
								return false
							}
							seeker(data.data.ThreadComment[0])
						}
					)
				}
				thingy.onmouseover = function(){
					if(!thingy.querySelector(".count")){
						return
					}
					let likeCount = parseInt(thingy.querySelector(".count").innerText);
					if(likeCount <= 5){
						return
					}
					if(thingy.classList.contains("hohLoadedLikes")){
						return
					}
					thingy.classList.add("hohLoadedLikes");
					updateLikes()
				}
				thingy.onclick = function(){
					//TODO handle this locally
					setTimeout(updateLikes,2000)
				}
			});

			// forum threads
			let thingy = document.querySelector(".forum-thread .body .actions .like-wrap.thread:not(.hohHandledLike)");
			if(thingy){
				thingy.classList.add("hohHandledLike");
				let shortlist = null;
				let updateLikes = function(){
					if(shortlist && shortlist.data.Page.likes.length >= 25 && !shortlist.data.Page.likes.map(like => like.name).includes(whoAmI)){
						return
					}
					let [,threadId] = location.pathname.match(/^\/forum\/thread\/(\d+)/);
					if(!threadId){
						return
					}
					const id = parseInt(threadId);
					generalAPIcall(`
query ($id: Int, $type: LikeableType) {
	Page(perPage: 20) {
		likes(likeableId: $id, type: $type) {
			name
			avatar {
				large
			}
		}
	}
}`,
						{id, type: "THREAD"},
						data => {
							if(!data){
								return
							}
							shortlist = data;
							let seeker = function(comment){
								let userList = thingy.querySelector(".users");
								let waitForAnilist = function(tries){
									tries--;
									if(!userList.children.length && tries){
										setTimeout(function(){waitForAnilist(tries)},200);
										return
									}
									for(let i=userList.children.length;i<comment.likes.length;i++){
										let newEle = userList.children[0].cloneNode();//to be up to date with those random attributes
										newEle.href = "/user/" + comment.likes[i].name + "/";
										newEle.style.backgroundImage = 'url("' + comment.likes[i].avatar.large + '")';
										userList.appendChild(newEle)
									}
									if(userList.children.length>comment.likes.length){
										for(let i=comment.likes.length;i<userList.children.length;i++){
											userList.children[i].remove();
										}
									}
								};waitForAnilist(20);
								return true
							}
							seeker(data.data.Page)
						}
					)
				}
				thingy.onmouseover = function(){
					if(!thingy.querySelector(".count")){
						return
					}
					let likeCount = parseInt(thingy.querySelector(".count").innerText);
					if(likeCount <= 5){
						return
					}
					if(thingy.classList.contains("hohLoadedLikes")){
						return
					}
					thingy.classList.add("hohLoadedLikes");
					updateLikes()
				}
				thingy.onclick = function(){
					//TODO handle this locally
					setTimeout(updateLikes,2000)
				}
			}
		},400);
	}
})
//end modules/forumVisualLikes.js
//begin modules/hideGlobalFeed.js
function hideGlobalFeed(){
	if(!location.pathname.match(/^\/home/)){
		return
	}
	let toggle = document.querySelector(".feed-type-toggle");
	if(!toggle){
		setTimeout(hideGlobalFeed,100);
		return
	}
	toggle.children[1].style.display = "none";
	if(toggle.children[1].classList.contains("active")){
		toggle.children[0].click()
	}
}
//end modules/hideGlobalFeed.js
//begin modules/hideScores.js
exportModule({
	id: "hideScores",
	description: "$hideScores_description",
	extendedDescription: "$hideScores_extendedDescription",
	isDefault: false,
	importance: 0,
	categories: ["Feeds","Forum","Media","Browse","Newly Added"],
	visible: true,
	urlMatch: function(url){
		return /^https:\/\/anilist\.co\/home\/?$/.test(url) || /^https:\/\/anilist\.co\/(anime|manga|user)\/.*/.test(url) || /^https:\/\/anilist\.co\/forum\/thread\/.*/.test(url)
	},
	code: async function(){
		if(/^\/(anime|manga)\/.*/.test(location.pathname)){
			const sidebarNode = document.querySelector(".sidebar .data") || await watchElem(".sidebar .data");
			let existing = Array.from(sidebarNode.querySelectorAll(".altSpoiler"));
			if (existing.length){
				existing.forEach(oldRow => {
					oldRow.classList.remove("altSpoiler");
					oldRow.removeAttribute("onclick");
					oldRow.removeAttribute("data-click")
				})
			}
			let scoreSpoiler = function(mutations,observer){
				let sidebarData = Array.from(sidebarNode.querySelectorAll(".data-set .type"));
				if(!sidebarData.length){
					return
				};
				let status = sidebarData.find(element => element.innerText === "Status");
				if(!status || status.parentNode.childElementCount != 2){
					return
				}
				if(status.parentNode.children[1].firstChild.nodeValue === "Not Yet Released"){
					observer && observer.disconnect();
					return true
				}
				let scoreNode = new Array();
				let findAvg = sidebarData.find(element => element.innerText === "Average Score");
				let findMean = sidebarData.find(element => element.innerText === "Mean Score");
				findAvg && scoreNode.push(findAvg);
				findMean && scoreNode.push(findMean);
				findAvg && findMean && observer && observer.disconnect();
				if(scoreNode.length){
					scoreNode.forEach(score => {
						!score.parentNode.children[1].classList.contains("altSpoiler") && score.parentNode.children[1].classList.add("altSpoiler");
						score.parentNode.children[1].onclick = function(event){
							event.stopPropagation();
							this.hasAttribute("data-click") ? this.removeAttribute("data-click") : this.setAttribute("data-click","1")
						}
					})
				}
				if(findAvg && findMean){
					return true
				}
			};
			let mutationConfig = {
				attributes: false,
				childList: true,
				subtree: true
			};
			let observer = new MutationObserver(scoreSpoiler);
			!scoreSpoiler() && observer.observe(sidebarNode,mutationConfig)
		}
		if(/^\/home\/?$/.test(location.pathname) || /^\/forum\/thread\/.*/.test(location.pathname) || /^\/user\/.*/.test(location.pathname)){
			let pNode;
			if(/^\/home\/?$/.test(location.pathname) || /^\/user\/.*/.test(location.pathname)){
				pNode = document.querySelector(".activity-feed-wrap") || await watchElem(".activity-feed-wrap");
			}
			else{
				pNode = document.querySelector(".forum-thread") || await watchElem(".forum-thread");
			}
			let removeEmbedScore = function(mutations,observer){
				let embed = Array.from(pNode.querySelectorAll(".embed .wrap .info:not(.hohEmbedHiddenScore)"));
				if(embed.length){
					embed.forEach(element => {
						if(element.children[2] && element.children[2].innerText.includes("Not Yet Released")){
							element.classList.add("hohEmbedHiddenScore");
						}
						if(element.children[4] && /^([1-9][0-9]?|100)%$/.test(element.children[4].innerText.trim().slice(-3))){
							element.children[4].innerText = "";
							element.classList.add("hohEmbedHiddenScore")
						}
						if(element.children[3] && element.children[3].innerText.trim().slice(-1) == "·"){
							element.children[3].innerText = element.children[3].innerText.replace("·","").trim()
						}
					})
				}
			};
			removeEmbedScore();
			let mutationConfig = {
				attributes: false,
				childList: true,
				subtree: true
			};
			let observer = new MutationObserver(removeEmbedScore);
			observer.observe(pNode,mutationConfig)
		}
	},
	css: `
	.overview .media-score-distribution:not(:hover){
		background-color: rgba(var(--color-black),0.5);
	}
	.overview .media-score-distribution .ct-chart-bar:not(:hover), .media-card .hover-data .score, .overview .follow .score:not(:hover), .table .media-card .score .icon:not(:hover), .media-card .data .score .icon:not(:hover){
		opacity: 0;
		user-select: none;
	}
	.overview .follow span, .table .media-card .score .percentage, .table .media-card .score .popularity, .media-card .data .score, .media-card .data .score .percentage{
		text-align: center;
		border-radius: 3px;
		background-color: rgba(var(--color-black),0.5);
		color: white;
		user-select: none;
	}
	.overview .follow span:not(:hover), .table .media-card .score .percentage:not(:hover), .table .media-card .score .popularity:not(:hover), .media-card .data .score .percentage:not(:hover){
		color: transparent;
	}
	.value.altSpoiler{
		background-color: rgba(var(--color-black),0.5);
		color: transparent;
		padding: 0px 10px;
		border-radius: 3px;
		user-select: none;
		cursor: pointer;
	}
	.value.altSpoiler:hover, .value.altSpoiler[data-click]{
		color: white;
	}
	`
})
//end modules/hideScores.js
//begin modules/hollowHearts.js
// SPDX-FileCopyrightText: 2021 Reina
// SPDX-License-Identifier: MIT
/*
Copyright (c) 2021 Reina

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice (including the next paragraph) shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//updated code here: https://github.com/Reinachan/AniList-High-Contrast-Dark-Theme
exportModule({
	id: "hollowHearts",
	description: "$hollowHearts_description",
	isDefault: true,
	importance: 0.9,
	categories: ["Feeds"],
	visible: true,
	css: `
/* Like heart */
.action.likes .button,
.like-wrap.thread_comment .button {
	color: rgb(var(--color-blue-dim));
}
.action.likes .button:hover,
.like-wrap.thread_comment .button:hover {
	color: rgb(var(--color-blue));
}
.action.likes .button .fa-heart,
.like-wrap.thread_comment .button .fa-heart {
	color: #0000;
	stroke: rgb(var(--color-blue-dim));
	stroke-width: 70;
	font-size: 0.87em;
	padding-bottom: 0.08em;
	padding-top: 0.05em;
}
.action.likes .button .fa-heart:hover,
.like-wrap.thread_comment .button .fa-heart:hover {
	stroke: rgb(var(--color-blue));
}
.action.likes .button.liked,
.like-wrap.thread_comment .button.liked {
	color: rgb(var(--color-red));
}
.action.likes .button.liked:hover,
.like-wrap.thread_comment .button.liked:hover {
	--color-red: 246, 124, 144;
	color: rgb(var(--color-red));
}
.action.likes .button.liked:hover .fa-heart,
.like-wrap.thread_comment .button.liked:hover .fa-heart {
	color: rgb(var(--color-red));
}
.action.likes .button.liked .fa-heart,
.like-wrap.thread_comment .button.liked .fa-heart {
	color: var(--color-red);
	stroke: rgba(0, 0, 0, 0);
	stroke-width: 0;
	font-size: 0.875em;
	padding-bottom: 0;
	padding-top: 0;
}
.action.likes .button.liked .fa-heart:hover,
.like-wrap.thread_comment .button.liked .fa-heart:hover {
	color: rgb(var(--color-red));
}
/* forum thread, favourite like heart */
.like-wrap.thread .button .fa-heart,
.actions .favourite .fa-heart,
.studio .favourite .fa-heart {
	color: #0000;
	stroke: rgb(var(--color-white));
	stroke-width: 70;
}
.like-wrap.thread .button.liked .fa-heart,
.actions .favourite.liked .fa-heart,
.studio .favourite.liked .fa-heart,
.like-wrap.thread .button.isFavourite .fa-heart,
.actions .favourite.isFavourite .fa-heart,
.studio .favourite.isFavourite .fa-heart {
	color: rgb(var(--color-white)) !important;
	stroke: rgba(0, 0, 0, 0) !important;
}
`
})
//end modules/hollowHearts.js
//begin modules/imageFreeEditor.js
exportModule({
	id: "imageFreeEditor",
	description: "$imageFreeEditor_description",
	isDefault: false,
	importance: -2,
	categories: ["Media","Lists"],
	visible: true,
	css: `
.list-editor-wrap .cover{
	display: none;
}
.list-editor-wrap .header{
	background-image: none!important;
	height: auto;
	box-shadow: none;
	background: rgb(var(--color-foreground));
}
.list-editor-wrap .header::after{
	background: none;
}
.list-editor-wrap .header .content{
	align-items: center;
}
.list-editor-wrap .header .title{
	padding: 0;
}
.list-editor-wrap .header .favourite{
	margin-bottom: 0;
}
.list-editor-wrap .header .save-btn{
	margin-bottom: 0;
}
.list-editor-wrap .list-editor .body{
	padding-top: 20px;
}
@media (max-width: 760px){
	.list-editor-wrap .header .content{
		padding-top: 60px;
	}
}
	`
})
//end modules/imageFreeEditor.js
//begin modules/infoTable.js
exportModule({
	id: "infoTable",
	description: "$setting_infoTable",
	isDefault: false,
	importance: 1,
	categories: ["Media"],
	visible: true,
	css: `
.media-page-unscoped > .content.container{
	grid-template-columns: 215px auto;
}
.media-page-unscoped .sidebar > .data{
	padding: 15px;
}
.media-page-unscoped .data-set,
.media-page-unscoped .data-set #hohMALserialization{
	display: inline-block;
	width: 100%;
	padding-bottom: 9px!important;
	padding-top: 4px;
}
.media-page-unscoped .data-set ~ .data-set{
	border-top-style: solid;
	border-top-width: 1px;
	border-top-color: rgb(var(--color-background));
}
.media-page-unscoped .data-set .type{
	display: inline;
}
.media-page-unscoped .data-set .value{
	display: inline;
	float: right;
	margin-top: 2px;
}`
})
//end modules/infoTable.js
//begin modules/interestingRecs.js
exportModule({
	id: "interestingRecs",
	description: "$interestingRecs_description",
	isDefault: true,
	categories: ["Login"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/https:\/\/anilist\.co\/recommendations/) && useScripts.accessToken
	},
	code: function(){
		let buttonInserter = function(){
			if(!document.URL.match(/https:\/\/anilist\.co\/recommendations/)){
				return
			}
			let switchL = document.querySelector(".page-content .switch:not(.list-switch) .options");
			if(switchL && document.querySelector(".recommendations-wrap")){
				switchL.parentNode.classList.add("hohRecsSwitch");
				let optionWrapper = create("div","option",false,switchL);
				let option = create("span",false,translate("$recs_forYou"),optionWrapper);
				option.title = translate("$recs_description");
				let fakeContent = create("div",["recommendations-wrap","substitute"],false,false,"display:none;");
				let realNode = document.querySelector(".recommendations-wrap");
				realNode.parentNode.insertBefore(fakeContent,realNode);
				optionWrapper.onclick = function(){
					switchL.querySelector(".active").classList.remove("active");
					fakeContent.style.display = "grid";
					realNode.style.display = "none";
					optionWrapper.classList.add("active");
					if(fakeContent.childElementCount){
						return
					}
					authAPIcall(`
query($id: Int){
	Page{
		mediaList(status:COMPLETED,sort:SCORE_DESC,userId:$id){
			... stuff
		}
	}
	Page2:Page(page:2){
		mediaList(status:COMPLETED,sort:SCORE_DESC,userId:$id){
			... stuff
		}
	}
}

fragment stuff on MediaList{
	rawScore:score(format:POINT_100)
	media{
		id
		siteUrl
		coverImage{large color}
		title{romaji native english}
		recommendations(sort:RATING_DESC){
			nodes{
				rating
				userRating
				mediaRecommendation{
					id
					siteUrl
					averageScore
					coverImage{large color}
					title{romaji native english}
					mediaListEntry{
						status
					}
				}
			}
		}
	}
}
`,
						{id: whoAmIid},
						function(data){
							if(!data){
								let pairCard = create("div",["recommendation-pair-card","error"],"error loading data",fakeContent);
								return
							}
							let possRecs = [];
							data.data.Page.mediaList.concat(data.data.Page2.mediaList).forEach(entry => {
								entry.media.recommendations.nodes.forEach(node => {
									if(node.mediaRecommendation){
										possRecs.push({
											first: {
												id: entry.media.id,
												score: entry.rawScore,
												title: entry.media.title,
												siteUrl: entry.media.siteUrl,
												coverImage: entry.media.coverImage
											},
											second: {
												id: node.mediaRecommendation.id,
												mediaListEntry: node.mediaRecommendation.mediaListEntry,
												title: node.mediaRecommendation.title,
												siteUrl: node.mediaRecommendation.siteUrl,
												averageScore: node.mediaRecommendation.averageScore,
												coverImage: node.mediaRecommendation.coverImage
											},
											rating: node.rating,
											userRating: node.userRating
										})
									}
								})
							});
							if(possRecs.length === 0){
								let pairCard = create("div",["recommendation-pair-card","error"],"no recommendations found :(",fakeContent);
								return
							}
							possRecs.filter(
								rec => ((!rec.second.mediaListEntry) || rec.second.mediaListEntry.status === "PLANNING")
									&& rec.rating > 0
									&& rec.userRating !== "RATE_DOWN"//don't count this recommendation if the user has actively stated it is bad
							).sort(
								(b,a) => (a.first.score + a.second.averageScore || 41) * (1 - 1/(a.rating + 1))
									- (b.first.score + b.second.averageScore || 41) * (1 - 1/(b.rating + 1))
							).forEach(rec => {
								let pairCard = create("div","recommendation-pair-card",false,fakeContent);
									let first = create("a","media",false,pairCard);
									first.href = rec.first.siteUrl;
										let firstCover = create("div","cover",false,first);
										firstCover.style.backgroundColor = rec.first.coverImage.color;
										firstCover.style.backgroundImage = "url(\"" + rec.first.coverImage.large + "\")";
										let firstTitle = create("div","title",false,first);
											let firstTitleSpan = create("span",false,titlePicker(rec.first),firstTitle);
									let second = create("a","media",false,pairCard);
									second.href = rec.second.siteUrl;
										let secondCover = create("div","cover",false,second);
										secondCover.style.backgroundColor = rec.second.coverImage.color;
										secondCover.style.backgroundImage = "url(\"" + rec.second.coverImage.large + "\")";
										let secondTitle = create("div","title",false,second);
											let secondTitleSpan = create("span",false,titlePicker(rec.second),secondTitle);
									let ratingWrap = create("div","rating-wrap",false,pairCard);
										let actions = create("div","actions",false,ratingWrap);
											let thumbsDownWrap = create("div",["icon","thumbs-down"],false,actions,"margin-right:10px;");
											thumbsDownWrap.appendChild(svgAssets2.thumbsDown.cloneNode(true));
											if(rec.userRating === "RATE_DOWN"){
												thumbsDownWrap.style.color = "rgb(var(--color-red))"
											}
											let thumbsUpWrap = create("div",["icon","thumbs-up"],false,actions);
											if(rec.userRating === "RATE_UP"){
												thumbsUpWrap.style.color = "rgb(var(--color-green))"
											}
											thumbsUpWrap.appendChild(svgAssets2.thumbsUp.cloneNode(true));
										let rating = create("div","rating",0,ratingWrap);
										if(rec.rating > 0){
											rating.innerText = "+" + rec.rating
										}
								thumbsDownWrap.onclick = function(){
									if(rec.userRating === "NO_RATING" || rec.userRating === "RATE_UP"){
										authAPIcall(
											`mutation{SaveRecommendation(mediaId:${rec.first.id},mediaRecommendationId:${rec.second.id},rating:RATE_DOWN){id}}`,
											{},
											data => {
												if(data.data){
													thumbsDownWrap.style.color = "rgb(var(--color-red))";
													if(rec.userRating === "RATE_UP"){
														thumbsUpWrap.style.color = "inherit";
														rec.rating--;
													}
													rec.userRating = "RATE_DOWN";
													rec.rating--;
													if(rec.rating > 0){
														rating.innerText = "+" + rec.rating
													}
													else{
														rating.innerText = 0
													}
												}
											}
										)
									}
									else{
										authAPIcall(
											`mutation{SaveRecommendation(mediaId:${rec.first.id},mediaRecommendationId:${rec.second.id},rating:NO_RATING){id}}`,
											{},
											data => {
												if(data.data){
													thumbsDownWrap.style.color = "inherit";
													rec.userRating = "NO_RATING";
													rec.rating++;
													rating.innerText = "+" + rec.rating
												}
											}
										)
									}
								}
								thumbsUpWrap.onclick = function(){
									if(rec.userRating === "NO_RATING" || rec.userRating === "RATE_DOWN"){
										authAPIcall(
											`mutation{SaveRecommendation(mediaId:${rec.first.id},mediaRecommendationId:${rec.second.id},rating:RATE_UP){id}}`,
											{},
											data => {
												if(data.data){
													thumbsUpWrap.style.color = "rgb(var(--color-green))";
													if(rec.userRating === "RATE_UP"){
														thumbsDownWrap.style.color = "inherit";
														rec.rating++;
													}
													rec.userRating = "RATE_UP";
													rec.rating++;
													rating.innerText = "+" + rec.rating
												}
											}
										)
									}
									else{
										authAPIcall(
											`mutation{SaveRecommendation(mediaId:${rec.first.id},mediaRecommendationId:${rec.second.id},rating:NO_RATING){id}}`,
											{},
											data => {
												if(data.data){
													thumbsUpWrap.style.color = "inherit";
													rec.userRating = "NO_RATING";
													rec.rating--;
													if(rec.rating > 0){
														rating.innerText = "+" + rec.rating
													}
													else{
														rating.innerText = 0
													}
												}
											}
										)
									}
								}
							})
						}
					)
				};
				let normal = function(event){
					optionWrapper.classList.remove("active");
					fakeContent.style.display = "none";
					realNode.style.display = "grid";
					if(event.target.classList.contains("option")){
						event.target.classList.add("active")
					}
					else{
						event.target.parentNode.classList.add("active")
					}
				}
				switchL.children[0].addEventListener("click",normal);
				switchL.children[1].addEventListener("click",normal);
				switchL.children[2].addEventListener("click",normal);
			}
			else{
				setTimeout(buttonInserter,200)
			}
		};buttonInserter()
	}
})
//end modules/interestingRecs.js
//begin modules/keepAlive.js
exportModule({
	boneless_disable: true,
	id: "keepAlive",
	description: translate("$keepAlive_description") + " " + translate("$settings_experimental_suffix"),
	extendedDescription: "$keepAlive_extendedDescription",
	isDefault: false,
	importance: 0,
	categories: ["Script"],
	visible: true
})

new MutationObserver(function(){
	let messages = Array.from(document.querySelectorAll(".el-message--error.is-closable"));
	if(messages.some(message => message.textContent === "Session expired, please refresh")){
		fetch("index.html").then(function(response){
			return response.text()
		}).then(function(html){
			let token = html.match(/window\.al_token = "([a-zA-Z0-9]+)";/);
			console.log("token",token);
			if(!token){
				return//idk, stuff changed, better do nothing
			}
			window.al_token = token;
			//alert the other tabs so they don't have to do the same
			try{
				aniCast.postMessage({type:"sessionToken",value:token});
			}
			catch(e){
				aniCastFailure(e)
			}
			//fetch the alert list again, they may have piled up while fetching
			Array.from(document.querySelectorAll(".el-message--error.is-closable")).forEach(message => {
				if(message.textContent === "Session expired, please refresh"){
					message.querySelector(".el-message__closeBtn").click()
				}
			});
		}).catch(function(){})//fail silently, trust Anilist to do the right thing by default
	}
}).observe(
	document.body,
	{attributes: false, childList: true, subtree: false}
)
//end modules/keepAlive.js
//begin modules/mangaBrowse.js
exportModule({
	id: "mangaBrowse",
	description: "$mangaBrowse_description",
	isDefault: false,
	categories: ["Browse","Navigation"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return false
	}
})

if(useScripts.mangaBrowse){
	let finder = function(){
		let navLinks = document.querySelector(`#nav .links .link[href="/search/anime"]`);
		if(navLinks){
			navLinks.href = "/search/manga";
			navLinks.onclick = function(){
				try{
					document.getElementById('app').__vue__._router.push({ name: 'Search', params: {type:'manga'}});
					return false
				}
				catch(e){
					let mangaBrowseLink = navLinks.cloneNode(true);//copying and pasting the node should remove all event references to it
					navLinks.parentNode.replaceChild(mangaBrowseLink,navLinks);
				}
			}
		}
		else{
			setTimeout(finder,1000)
		}
	}
	finder()
}
//end modules/mangaBrowse.js
//begin modules/mangaGuess.js
function mangaGuess(cleanAnime,id){
	let sidebarData;
	let adder = function(mutations,observer){
		let URLstuff = location.pathname.match(/^\/manga\/(\d+)\/?(.*)?/);
		if(!URLstuff){
			return
		}
		sidebarData = document.querySelector(".sidebar .data");
		if(!sidebarData){
			setTimeout(adder,200);
			return
		}
		let possibleMangaGuess = sidebarData.querySelector(".data-set .value[data-media-id]");
		if(possibleMangaGuess && (
			cleanAnime
			|| id !== parseInt(possibleMangaGuess.dataset.mediaId)
		)){
			removeChildren(possibleMangaGuess)
		}
		if(cleanAnime){
			return
		}
		let status = Array.from(sidebarData.querySelectorAll(".data-set .type")).find(element => element.innerText === "Status" || element.innerText === translate("$dataSet_status"));
		if(!status || status.parentNode.childElementCount !== 2){
			return true
		}
		observer && observer.disconnect();
		let possibleReleaseStatus = status.parentNode.children[1];
		if(possibleReleaseStatus.firstChild.nodeValue !== "Releasing" && possibleReleaseStatus.firstChild.nodeValue !== "Hiatus"){
			return
		}
		if(
			possibleReleaseStatus.dataset.mediaId === URLstuff[1]
			&& possibleReleaseStatus.children.length !== 0
		){
			return
		}
		else{
			removeChildren(possibleReleaseStatus)
		}
		possibleReleaseStatus.dataset.mediaId = URLstuff[1];
		const variables = {id: parseInt(URLstuff[1]),userName: whoAmI};
		let query = `
query($id: Int,$userName: String){
	Page(page: 1){
		activities(
			mediaId: $id,
			sort: ID_DESC
		){
			... on ListActivity{
				progress
				userId
			}
		}
	}
	MediaList(
		userName: $userName,
		mediaId: $id
	){
		progress
	}
}`;
		let possibleMyStatus = document.querySelector(".actions .list .add");
		const simpleQuery = !possibleMyStatus || possibleMyStatus.innerText === "Add to List" || possibleMyStatus.innerText === "Planning";
		if(simpleQuery){
			query = `
query($id: Int){
	Page(page: 1){
		activities(
			mediaId: $id,
			sort: ID_DESC
		){
			... on ListActivity{
				progress
				userId
			}
		}
	}
}`;
		}
		let highestChapterFinder = function(data){
			if(possibleReleaseStatus.children.length !== 0){
				return
			}
			let guesses = [];
			let userIdCache = new Set();
			data.data.Page.activities.forEach(activity => {
				if(activity.progress){
					let chapterMatch = parseInt(activity.progress.match(/\d+$/)[0]);
					if(!userIdCache.has(activity.userId) && chapterMatch !== 65535){
						guesses.push(chapterMatch);
						userIdCache.add(activity.userId)
					}
				}
			});
			guesses.sort(VALUE_DESC);
			if(guesses.length){
				let bestGuess = guesses[0];
				if(guesses.length > 2){
					if(guesses.filter(val => val < 7000).length){
						guesses = guesses.filter(val => val < 7000)
					}
					let diff = guesses[0] - guesses[1];
					let inverseDiff = 1 + Math.ceil(25/(diff+1));
					if(guesses.length >= inverseDiff){
						if(
							guesses[1] === guesses[inverseDiff]
							|| guesses[0] - guesses[1] > 500
							|| (guesses[0] - guesses[1] > 100 && guesses[1] >= guesses[inverseDiff] - 1)
						){
							bestGuess = guesses[1];
							if(guesses.length > 15 && guesses[1] - guesses[2] > 50 && guesses[2] === guesses[guesses.length - 1]){
								bestGuess = guesses[2]
							}
						}
					}
				}
				if(hasOwn(commonUnfinishedManga, variables.id)){
					if(bestGuess < commonUnfinishedManga[variables.id].chapters){
						bestGuess = commonUnfinishedManga[variables.id].chapters
					}
				}
				if(simpleQuery && bestGuess){
					create("span","hohGuess"," (" + bestGuess + "?)",possibleReleaseStatus)
				}
				else{
					bestGuess = Math.max(bestGuess,data.data.MediaList.progress);
					if(bestGuess){
						if(bestGuess === data.data.MediaList.progress){
							create("span","hohGuess"," (" + bestGuess + "?)",possibleReleaseStatus,"color:rgb(var(--color-green));")
						}
						else{
							create("span","hohGuess"," (" + bestGuess + "?)",possibleReleaseStatus);
							create("span","hohGuess"," [+" + (bestGuess - data.data.MediaList.progress) + "]",possibleReleaseStatus,"color:rgb(var(--color-red));")
						}
					}
				}
			}
		};
		try{
			generalAPIcall(query,variables,highestChapterFinder,"hohMangaGuess" + variables.id,30*60*1000)
		}
		catch(e){
			sessionStorage.removeItem("hohMangaGuess" + variables.id)
		}
	}
	let mutationConfig = {
		attributes: false,
		childList: true,
		subtree: true
	};
	let observer = new MutationObserver(adder);
	adder();
	if(sidebarData){
		observer.observe(sidebarData,mutationConfig)
	}
}
//end modules/mangaGuess.js
//begin modules/markdownHelp.js
exportModule({
	id: "markdownHelp",
	description: "$markdown_help_description",
	isDefault: false,
	categories: ["Navigation"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return true
	},
	code: function(){
		let markdownHelper = document.getElementById("hohMarkdownHelper");
		if(markdownHelper){
			return
		}
		markdownHelper = create("span","#hohMarkdownHelper","</>?",document.getElementById("app"));
		markdownHelper.title = translate("$markdown_help_title");
		markdownHelper.onclick = function(){
			let existing = document.querySelector(".hohDisplayBox");
			if(existing){
				existing.remove()
			}
			else{
				let disp = createDisplayBox("height: 600px;",translate("$markdown_help_title"));
				create("h3","hohGuideHeading",translate("$markdown_help_images_header"),disp);
				create("pre","hohCode","img(your link here)",disp);
				create("pre","hohCode","img(https://i.stack.imgur.com/Wlvkk.jpg)",disp);
				create("p",false,translate("$markdown_help_imageUpload"),disp);
				create("p",false,translate("$markdown_help_imageSize"),disp);
				create("pre","hohCode","img300(your link here)",disp);
				create("p",false,translate("$markdown_help_infixOr"),disp);
				create("pre","hohCode","img40%(your link here)",disp);
				create("h3","hohGuideHeading",translate("$markdown_help_links_header"),disp);
				create("pre","hohCode","[link text](URL)",disp);
				create("pre","hohCode","[cool show](https://en.wikipedia.org/wiki/Urusei_Yatsura)",disp);
				create("p",false,"To get a media preview card, just put the Anilist URL of the show:",disp);
				create("pre","hohCode","https://anilist.co/anime/1293/Urusei-Yatsura/",disp);
				create("p",false,"To make an image a link, put the image markdown inside the link markdown, with a space on both sides",disp);
				create("pre","hohCode","[ img(image URL) ](link URL)",disp);
				create("h3","hohGuideHeading",translate("$markdown_help_formatting_header"),disp);
				create("h1",false,"headline",disp);
				create("pre","hohCode","# headline",disp);
				create("i",false,"italics",disp);
				create("pre","hohCode","*italics* or _italics_",disp);
				create("b",false,"bold",disp);
				create("pre","hohCode","**bold** or __bold__",disp);
				create("del",false,"strikethrough",disp);
				create("pre","hohCode","~~strikethrough~~",disp);
				create("span",false,"Use a backslash \\ to undo special meaning of formatting symols like * ~ # _ \\",disp);
				create("pre","hohCode","Use a backslash \\\\ to undo special meaning of formatting symols like \\* \\~ \\# \\_ \\\\",disp);
				create("a",["link","hohGuideHeading"],"Full guide",disp).href = "https://anilist.co/forum/thread/6125";
				create("span",false," ◆ ",disp);
				create("a",["link","hohGuideHeading"],"Make emojis work",disp).href = "https://files.kiniro.uk/unicodifier.html";
			}
		}
	}
})
//end modules/markdownHelp.js
//begin modules/meanScoreBack.js
//rename?
function meanScoreBack(){
	const userRegex = /^\/user\/([^/]+)\/?$/;
	let URLstuff = location.pathname.match(userRegex);
	if(!URLstuff){
		return
	}
	const query = `
	query($userName: String) {
		User(name: $userName){
			statistics{
				anime{
					episodesWatched
					meanScore
				}
				manga{
					volumesRead
					meanScore
				}
			}
		}
	}`;
	let variables = {
		userName: decodeURIComponent(URLstuff[1])
	}
	generalAPIcall(query,variables,function(data){
		if(!data){
			return;
		}
		let adder = function(){
			if(
				!userRegex.test(location.pathname)
				|| location.pathname.match(userRegex)[1] !== URLstuff[1]
			){
				return
			}
			let possibleStatsWrap = document.querySelectorAll(".stats-wrap .stats-wrap");
			if(possibleStatsWrap.length){
				if(possibleStatsWrap.length === 2 && possibleStatsWrap[0].childElementCount === 3){
					if(data.data.User.statistics.anime.meanScore){
						let statAnime = create("div","stat",false,possibleStatsWrap[0]);
						create("div","value",data.data.User.statistics.anime.episodesWatched,statAnime);
						create("div","label",translate("$milestones_totalEpisodes"),statAnime);
						let totalDays = possibleStatsWrap[0].children[1].children[0].innerText;
						possibleStatsWrap[0].children[1].remove();
						possibleStatsWrap[0].parentNode.querySelector(".milestone:nth-child(2)").innerText = translate("$milestones_daysWatched",totalDays);
						possibleStatsWrap[0].parentNode.classList.add("hohMilestones")
					}
					if(data.data.User.statistics.manga.meanScore){
						let statManga = create("div","stat",false,possibleStatsWrap[1]);
						create("div","value",data.data.User.statistics.manga.volumesRead,statManga);
						create("div","label",translate("$milestones_totalVolumes"),statManga);
						let totalChapters = possibleStatsWrap[1].children[1].children[0].innerText;
						possibleStatsWrap[1].children[1].remove();
						possibleStatsWrap[1].parentNode.querySelector(".milestone:nth-child(2)").innerText = translate("$milestones_chaptersRead",totalChapters);
						possibleStatsWrap[1].parentNode.classList.add("hohMilestones")
					}
				}
				else if(possibleStatsWrap[0].innerText.includes("Total Manga")){
					if(data.data.User.statistics.manga.meanScore){
						let statManga = create("div","stat",false,possibleStatsWrap[0]);
						create("div","value",data.data.User.statistics.manga.volumesRead,statManga);
						create("div","label",translate("$milestones_totalVolumes"),statManga);
						let totalChapters = possibleStatsWrap[0].children[1].children[0].innerText;
						possibleStatsWrap[0].children[1].remove();
						possibleStatsWrap[0].parentNode.querySelector(".milestone:nth-child(2)").innerText = translate("$milestones_chaptersRead",totalChapters);
						possibleStatsWrap[0].parentNode.classList.add("hohMilestones")
					}
				}
			}
			else{
				setTimeout(adder,200)
			}
		};adder();
	},"hohMeanScoreBack" + variables.userName,60*1000)
}
//end modules/meanScoreBack.js
//begin modules/mediaList.js
exportModule({
	id: "mediaList",
	description: "wrapper module for various unrelelated medialist modules",
	isDefault: true,
	categories: ["Lists"],
	visible: false,//not relevant in settings, adjust the wrapped modules instead
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/.+\/(anime|manga)list\/?(.*)?$/);
	},
	code: function(){
		const URLstuff = location.pathname.match(/^\/user\/(.+)\/(animelist|mangalist)/);
		if(!URLstuff){
			return
		}
		if(document.querySelector(".hohExtraFilters")){
			return
		}
		let waiter = function(){
			let filters = document.querySelector(".filters-wrap");
			if(!filters){
				setTimeout(waiter,200);
				return
			}
			let extraFilters = create("div","hohExtraFilters");
			extraFilters.style.marginTop = "15px";
			if(useScripts.draw3x3){
				let buttonDraw3x3 = create("button",["#hohDraw3x3","hohButton","button"],translate("$make3x3"),extraFilters);
				buttonDraw3x3.title = translate("$make3x3_title");
				buttonDraw3x3.onclick = function(){
					//this.style.color = "rgb(var(--color-blue))";
					let displayBox = createDisplayBox(false,"3x3 maker");
					let col_input = create("input","hohNativeInput",false,displayBox);
					let col_label = create("span",false,"columns",displayBox,"margin: 5px");
					col_input.type = "number";
					col_input.value = 3;
					col_input.step = 1;
					col_input.min = 0;
					let row_input = create("input","hohNativeInput",false,displayBox);
					let row_label = create("span",false,"rows",displayBox,"margin: 5px");
					create("br",false,false,displayBox)
					row_input.type = "number";
					row_input.value = 3;
					row_input.step = 1;
					row_input.min = 0;
					let margin_input = create("input","hohNativeInput",false,displayBox);
					let margin_label = create("span",false,"spacing (px)",displayBox,"margin: 5px");
					create("br",false,false,displayBox)
					margin_input.type = "number";
					margin_input.value = 0;
					margin_input.min = 0;
					let width_input = create("input","hohNativeInput",false,displayBox);
					let width_label = create("span",false,"image width (px)",displayBox,"margin: 5px");
					width_input.type = "number";
					width_input.value = 230;
					width_input.min = 0;
					let height_input = create("input","hohNativeInput",false,displayBox);
					let height_label = create("span",false,"image height (px)",displayBox,"margin: 5px");
					create("br",false,false,displayBox)
					height_input.type = "number";
					height_input.value = 345;
					height_input.min = 0;
					let fitMode = create("select","hohNativeInput",false,displayBox);
					let fitMode_label = create("span",false,"image fitting",displayBox,"margin	: 5px");
					let addOption = function(value,text){
						let newOption = create("option",false,text,fitMode);
						newOption.value = value;
					};
					addOption("scale","scale");
					addOption("crop","crop");
					addOption("hybrid","scale/crop hybrid");
					addOption("letterbox","letterbox");
					addOption("transparent","transparent letterbox");


					let recipe = create("p",false,translate("Click 9 media entries, then save the image below"),displayBox);
						
					let linkList = [];
					let keepUpdating = true;
					let image_width = 230;
					let image_height = 345;
					let margin = 0;
					let columns = 3;
					let rows = 3;
					let mode = fitMode.value;

					displayBox.parentNode.querySelector(".hohDisplayBoxClose").onclick = function(){
						displayBox.parentNode.remove();
						keepUpdating = false;
						cardList.forEach(function(card){
							card.draw3x3selected = false;
							card.style.borderStyle = "none"
						});
						counter = 0;
						linkList = []
					};

					let finalCanvas = create("canvas",false,false,displayBox,"max-height: 60%;max-width: 90%");
					let ctx = finalCanvas.getContext("2d");

					let updateDrawing = function(){
						finalCanvas.width = image_width*columns + (columns - 1) * margin;
						finalCanvas.height = image_height*rows + (rows - 1) * margin;
						ctx.clearRect(0,0,finalCanvas.width,finalCanvas.height);
						let drawStuff = function(image,x,y,width,height){
							let img = new Image();
							img.onload = function(){
								let sx = 0;
								let sy = 0;
								let sWidth = img.width;
								let sHeight = img.height;
								let dx = x;
								let dy = y;
								let dWidth = width
								let dHeight = height;
								//https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
								if(mode === "crop"){
									if(img.width/img.height > width/height){//crop sides
										let factor = img.height / height;
										sWidth = width * factor;
										sx = (img.width - sWidth)/2;
									}
									else{//crop top and bottom
										let factor = img.width / width;
										sHeight = height * factor;
										sy = (img.height - sHeight)/2;
									}
								}
								else if(mode === "hybrid"){
									if(img.width/img.height > width/height){//crop sides
										let factor = img.height / height;
										sWidth = width * factor;
										sWidth += (img.width - sWidth)/2
										sx = (img.width - sWidth)/2;
									}
									else{//crop top and bottom
										let factor = img.width / width;
										sHeight = height * factor;
										sHeight += (img.height - sHeight)/2;
										sy = (img.height - sHeight)/2;
									}
								}
								else if(mode === "letterbox" || mode === "transparent"){
									if(img.width/img.height > width/height){//too wide
										let factor = img.width / width;
										dHeight = img.height / factor;
										dy = y + (height - dHeight)/2;
									}
									else{//too tall
										let factor = img.height / height;
										dWidth = img.width / factor;
										dx = x + (width - dWidth)/2;
									}
									if(mode === "letterbox"){
										ctx.fillStyle = "black"
										ctx.fillRect(x,y,width,height)
									}

								}
								else{//scale
								}
								ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
							}
							img.src = image
						};
						for(var y=0;y<rows;y++){
							for(var x=0;x<columns;x++){
								if(linkList[y*columns+x] !== "empty"){
									drawStuff(
										linkList[y*columns+x],
										x*image_width + x*margin,
										y*image_height + y*margin,
										image_width,
										image_height
									)
								}
							}
						}
					}

					let updateConfig = function(){
						columns = parseInt(col_input.value) || 3;
						rows = parseInt(row_input.value) || 3;
						margin = parseInt(margin_input.value) || 0;
						image_width = parseInt(width_input.value) || 230;
						image_height = parseInt(height_input.value) || 345;
						mode = fitMode.value;
						displayBox.parentNode.querySelector(".hohDisplayBoxTitle").textContent = columns + "x" + rows + " maker";
						recipe.innerText = "Click " + (rows*columns) + " media entries, then save the image below"
						updateDrawing();
					}
					col_input.oninput = updateConfig;
					row_input.oninput = updateConfig;
					margin_input.oninput = updateConfig;
					width_input.oninput = updateConfig;
					height_input.oninput = updateConfig;
					fitMode.oninput = updateConfig;

					let updateCards = function(){
						let cardList = document.querySelectorAll(".entry-card.row,.entry.row");
						cardList.forEach(card => {
							card.onclick = function(){
								if(this.draw3x3selected){
									//linkList.splice(linkList.indexOf(this.draw3x3selected),1);
									linkList[linkList.indexOf(this.draw3x3selected)] = "empty";
									this.draw3x3selected = false;
									this.style.borderStyle = "none"
								}
								else{
									let val = this.querySelector(".cover .image").style.backgroundImage.replace("url(","").replace(")","").replace('"',"").replace('"',"");
									if(!linkList.some((place,index) => {
										if(place === "empty"){
											linkList[index] = val;
											return true
										}
										return false
									})){
										linkList.push(val);
									}
									this.draw3x3selected = val;
									this.style.borderStyle = "solid"
								}
								updateDrawing()
							}
						})
					};
					let waiter = function(){
						updateCards();
						if(keepUpdating){
							setTimeout(waiter,500)
						}
					};waiter();
				}
			}
			if(useScripts.newChapters && URLstuff[2] === "mangalist"){
				newChaptersInsertion(extraFilters)
			}
			if(URLstuff[2] === "mangalist"){
				let alMangaButton = create("button",["button","hohButton"],translate("$export_JSON"),extraFilters);
				alMangaButton.onclick = function(){
					generalAPIcall(backupQueryManga,
						{name: decodeURIComponent(URLstuff[1])},
						function(data){
							if(!data){
								alert("Export failed");
								return
							}
							data.data.version = "1.02";
							data.data.scriptInfo = scriptInfo;
							data.data.type = "MANGA";
							data.data.url = document.URL;
							data.data.timeStamp = NOW();
							saveAs(data.data,"AnilistMangaList_" + decodeURIComponent(URLstuff[1]) + ".json");
						}
					)
				}
			}
			if(URLstuff[2] === "animelist"){
				let alAnimeButton = create("button",["button","hohButton"],"Export JSON",extraFilters);
				alAnimeButton.onclick = function(){
					generalAPIcall(
						backupQueryAnime,
						{name: decodeURIComponent(URLstuff[1])},
						function(data){
							if(!data){
								alert("Export failed");
								return
							}
							data.data.version = "1.02";
							data.data.scriptInfo = scriptInfo;
							data.data.type = "ANIME";
							data.data.url = document.URL;
							data.data.timeStamp = NOW();
							saveAs(data.data,"AnilistAnimeList_" + decodeURIComponent(URLstuff[1]) + ".json");
						}
					)
				}
			}
			if(useScripts.tagIndex && (!useScripts.mobileFriendly)){
				let tagIndex = create("div","tagIndex",false,extraFilters);
				let collectNotes = function(data){
					let customTags = new Map();	
					let listData = returnList(data,true);
					let blurbs = [];
					listData.forEach(function(entry){
						if(entry.notes){
							(
								entry.notes.match(/(#(\\\s|\S)+)/g) || []
							).filter(
								tagMatch => !tagMatch.match(/^#039/)
							).map(
								tagMatch => evalBackslash(tagMatch)
							).forEach(tagMatch => {
								if(!customTags.has(tagMatch)){
									customTags.set(tagMatch,{name: tagMatch,count: 0})
								}
								customTags.get(tagMatch).count++
							})
							let noteContent = parseListJSON(entry.notes);
							if(noteContent && noteContent.lists){
								blurbs.push(noteContent.lists)
							}
						}
					});
					let applier = function(){
						const URLstuff2 = location.pathname.match(/^\/user\/(.+)\/(animelist|mangalist)/);
						if(!URLstuff2 || URLstuff[0] !== URLstuff2[0]){
							return
						}
						Array.from(document.querySelectorAll(".hohDescriptions")).forEach(matching => matching.remove());
						blurbs.forEach(blurb => {
							blurb.forEach(list => {
								if(list.name && list.info){
									let titles = document.querySelectorAll("h3.section-name");
									for(var i=0;i<titles.length;i++){
										if(titles[i].innerText === list.name){
											let descriptionNode = create("p","hohDescriptions",list.info);
											titles[i].parentNode.insertBefore(descriptionNode,titles[i].nextSibling);
											break
										}
									}
								}
							})
						});
						setTimeout(applier,1000)
					};
					applier();
					if(customTags.has("##STRICT")){
						customTags.delete("##STRICT")
					}
					customTags = [...customTags].map(pair => pair[1]);
					customTags.sort((b,a) => a.count - b.count || b.name.localeCompare(a.name));
					let drawTags = function(){
						removeChildren(tagIndex);
						if(customTags.length > 1){
							let sortName = create("span",false,"▲",tagIndex,"cursor:pointer");
							sortName.title = translate("$sortBy_name");
							let sortNumber = create("span",false,"▼",tagIndex,"cursor:pointer;float:right");
							sortNumber.title = translate("$sortBy_count");
							sortName.onclick = function(){
								customTags.sort((b,a) => b.name.localeCompare(a.name));
								drawTags()
							}
							sortNumber.onclick = function(){
								customTags.sort((b,a) => a.count - b.count || b.name.localeCompare(a.name));
								drawTags()
							}
						}
						customTags.forEach(tag => {
							if(tag.name.match(/,(malSync|last)::/)){
								return
							}
							let tagElement = create("p",false,tag.name,tagIndex);
							create("span","count",tag.count,tagElement);
							tagElement.onclick = function(){
								let filterBox = document.querySelector(".entry-filter input");
								filterBox.value = tag.name;
								filterBox.dispatchEvent(new Event("input"));
								if(filterBox.scrollIntoView){
									filterBox.scrollIntoView({"behavior": "smooth","block": "start"})
								}
								else{
									document.body.scrollTop = document.documentElement.scrollTop = 0
								}
							}
						})
					};
					if(customTags.some(tag => !tag.name.match(/,(malSync|last)::/))){
						drawTags()
					}
				};
				let variables = {
					name: decodeURIComponent(URLstuff[1]),
					listType: "ANIME"
				};
				if(URLstuff[2] === "mangalist"){
					variables.listType = "MANGA"
				}
				if(variables.name === whoAmI && reliablePersistentStorage){
					cache.getList(variables.listType,function(data){
						collectNotes(data)
					})
				}
				else{
					generalAPIcall(
`query($name: String!, $listType: MediaType){
	MediaListCollection(userName: $name, type: $listType){
		lists{
			entries{
				mediaId
				notes
			}
		}
	}
}`,
						variables,
						collectNotes,
						"hohCustomTagIndex" + variables.listType + variables.name,
						60*1000
					)
				}
			}
			filters.appendChild(extraFilters);
			let filterBox = document.querySelector(".entry-filter input");
			let searchParams = new URLSearchParams(location.search);
			let paramSearch = searchParams.get("search");
			if(paramSearch){
				filterBox.value = decodeURIComponent(paramSearch);
				let event = new Event("input");
				filterBox.dispatchEvent(event)
			}
			let filterChange = function(){
				let newURL = location.protocol + "//" + location.host + location.pathname 
				if(filterBox.value === ""){
					searchParams.delete("search")
				}
				else{
					searchParams.set("search",encodeURIComponent(filterBox.value));
					newURL += "?" + searchParams.toString()
				}
				current = newURL;
				history.replaceState({},"",newURL);
				if(document.querySelector(".el-icon-circle-close")){
					document.querySelector(".el-icon-circle-close").onclick = filterChange
				}
			}
			filterBox.oninput = filterChange;
			filterChange();
			let mutationConfig = {
				attributes: false,
				childList: true,
				subtree: true
			};
			if(
				decodeURIComponent(URLstuff[1]) === whoAmI
				&& useScripts.accessToken
				&& useScripts.plussMinus
				&& (
					document.querySelector(".medialist").classList.contains("POINT_100")
					|| document.querySelector(".medialist").classList.contains("POINT_10")
					|| document.querySelector(".medialist").classList.contains("POINT_10_DECIMAL")
					|| document.querySelector(".medialist").classList.contains("POINT_5")
				)
			){
				let minScore = 1;
				let maxScore = 100;
				let stepSize = 1;
				if(document.querySelector(".medialist").classList.contains("POINT_10") || document.querySelector(".medialist").classList.contains("POINT_10_DECIMAL")){
					maxScore = 10
				}
				if(document.querySelector(".medialist").classList.contains("POINT_10_DECIMAL")){
					minScore = 0.1;
					stepSize = 0.1
				}
				if(document.querySelector(".medialist").classList.contains("POINT_5")){
					maxScore = 5;
				}
				let scoreChanger = function(){
					observer.disconnect();
					lists.querySelectorAll(".list-entries .row .score").forEach(function(entry){
						if(!entry.childElementCount){
							let updateScore = function(isUp){
								let score = parseFloat(entry.attributes.score.value);
								if(isUp){
									score += stepSize
								}
								else{
									score -= stepSize
								}
								if(score >= minScore && score <= maxScore){
									let id = parseInt(entry.previousElementSibling.children[0].href.match(/(anime|manga)\/(\d+)/)[2]);
									lists.querySelectorAll("[href=\"" + entry.previousElementSibling.children[0].attributes.href.value + "\"]").forEach(function(rItem){
										rItem.parentNode.nextElementSibling.attributes.score.value = score.roundPlaces(1);
										rItem.parentNode.nextElementSibling.childNodes[1].textContent = " " + score.roundPlaces(1) + " "
									});
									authAPIcall(
										`mutation($id:Int,$score:Float){
											SaveMediaListEntry(mediaId:$id,score:$score){
												score
											}
										}`,
										{id:id,score:score},function(data){
											if(!data){
												if(isUp){
													score -= stepSize
												}
												else{
													score += stepSize
												}
												lists.querySelectorAll("[href=\"" + entry.previousElementSibling.children[0].attributes.href.value + "\"]").forEach(function(rItem){
													rItem.parentNode.nextElementSibling.attributes.score.value = score.roundPlaces(1);
													rItem.parentNode.nextElementSibling.childNodes[1].textContent = " " + score.roundPlaces(1) + " "
												})
											}
										}
									);
								}
							};
							let changeMinus = create("span","hohChangeScore","-");
							entry.insertBefore(changeMinus,entry.firstChild);
							let changePluss = create("span","hohChangeScore","+",entry);
							if(useScripts.CSSdecimalPoint){
								entry.classList.add("hohNeedsPositioning");
								changePluss.style.position = "absolute";
								changePluss.style.right = "calc(50% - 2em)";
							}
							changeMinus.onclick = function(){updateScore(false)};
							changePluss.onclick = function(){updateScore(true)}
						}
					});
					observer.observe(lists,mutationConfig)
				}
				let lists = document.querySelector(".lists");
				let observer = new MutationObserver(scoreChanger);
				observer.observe(lists,mutationConfig);
				scoreChanger()
			}
		};waiter()
	}
})
//end modules/mediaList.js
//begin modules/mediaTranslation.js
exportModule({
	id: "mediaTranslation",
	description: "$mediaTranslation_description",
	isDefault: false,
	importance: 0,
	categories: ["Media","Newly Added"],
	visible: true
})
//end modules/mediaTranslation.js
//begin modules/middleClickLinkFixer.js
function linkFixer(){
	if(location.pathname !== "/home"){
		return
	}
	let recentReviews = document.querySelector(".recent-reviews h2.section-header");
	let recentThreads = document.querySelector(".recent-threads h2.section-header");
	if(recentReviews && recentThreads){
		recentReviews.innerText = "";
		create("a",false,translate("$home_reviewLink"),recentReviews)
			.href = "/reviews";
		recentThreads.innerText = "";
		create("a",false,translate("$home_forumLink"),recentThreads)
			.href = "/forum/overview";
		let sectionHeaders = document.querySelectorAll(".section-header");
		Array.from(sectionHeaders).forEach(header => {
			if(header.innerText.match("Trending")){
				header.innerText = "";
				create("a",false,translate("$home_trendingAnime"),header)
					.href = "https://anilist.co/search/anime/trending";
				create("a","hover-manga",translate("$home_trendingManga"),header)
					.href = "https://anilist.co/search/manga/trending"
			}
			else if(header.innerText.match("Newly Added Anime")){
				header.innerText = "";
				create("a",false,translate("$home_newAnime"),header)
					.href = "https://anilist.co/search/anime/new"
			}
			else if(header.innerText.match("Newly Added Manga")){
				header.innerText = "";
				create("a","hover-manga",translate("$home_newManga"),header)
					.href = "https://anilist.co/search/manga/new"
			}
		})
	}
	else{
		if(useScripts.additionalTranslation){
			setTimeout(linkFixer,1000)
		}
		else{
			setTimeout(linkFixer,2000)//invisible change, does not take priority
		}
	}
}
//end modules/middleClickLinkFixer.js
//begin modules/mobileAdjustments.js
exportModule({
	id: "mobileFriendly",
	description: "$mobileFriendly_description",
	isDefault: false,
	importance: 7,
	categories: ["Navigation","Script"],
	visible: true
})

if(useScripts.mobileFriendly){
	let addReviewLink = function(){
		let footerPlace = document.querySelector(".footer .links section:last-child");
		if(footerPlace){
			let revLink = create("a",false,"Reviews",footerPlace,"display:block;padding:6px;");
			revLink.href = "/reviews/";
		}
		else{
			setTimeout(addReviewLink,500)
		}
	};addReviewLink();
}
//end modules/mobileAdjustments.js
//begin modules/mobileTags.js
exportModule({
	id: "CSSmobileTags",
	description: "$setting_CSSmobileTags",
	isDefault: true,
	importance: 0,
	categories: ["Media"],
	visible: true,
	css: `
@media(max-width: 760px){
	.media .sidebar .tags{
		display: inline;
	}
	.media .sidebar .tags .tag{
		display: inline-block;
		margin-right: 2px;
	}
	.media .sidebar .tags .tag .rank{
		display: inline;
	}
	.media .overview .tags .tag .vote-dropdown .el-dropdown-link{
		opacity: 1;
		display: inline!important;
	}
	.media .overview .tags .add-icon{
		opacity: 1;
		display: inline!important;
	}
	.media-page-unscoped .review.button{
		display: inline-block;
		width: 48%;
	}
	.media-page-unscoped .sidebar + .overview{
		margin-top: 20px;
	}
}`
})
//end modules/mobileTags.js
//begin modules/moreImports.js
function moreImports(){
	if(document.URL !== "https://anilist.co/settings/import"){
		return
	}
	let target = document.querySelector(".content .import");
	if(!target){
		setTimeout(moreImports,200);
		return;
	}
	create("hr","hohSeparator",false,target,"margin-bottom:40px;");
	let apAnime = create("div",["section","hohImport"],false,target);
	create("h2",false,"Anime-Planet: Import Anime List",apAnime);
	const mapFormatAnime = new Map([["All", ""], ["TV Show", "TV"], ["Movie", "MOVIE"], ["TV Short", "TV_SHORT"],
									["Special", "SPECIAL"], ["OVA", "OVA"], ["ONA", "ONA"], ["MUSIC", "MUSIC"]])
	let selectFormatAnime = create("select", "meter", false, apAnime)
	mapFormatAnime.forEach((_, key) => {
		let option = create("option", false, key, selectFormatAnime)
		option.value = key
	})

	let apAnimeCheckboxContainer = create("label","el-checkbox",false,apAnime);
	let apAnimeOverwrite = createCheckbox(apAnimeCheckboxContainer);
	create("span","el-checkbox__label","Overwrite anime already on my list",apAnimeCheckboxContainer);
	let apAnimeDropzone = create("div","dropbox",false,apAnime);
	let apAnimeInput = create("input","input-file",false,apAnimeDropzone);
	let apAnimeDropText = create("p",false,"Drop list JSON file here or click to upload",apAnimeDropzone);
	apAnimeInput.type = "file";
	apAnimeInput.name = "json";
	apAnimeInput.accept = "application/json";
	let apManga = create("div",["section","hohImport"],false,target);
	create("h2",false,"Anime-Planet: Import Manga List",apManga);

	const mapFormatManga = new Map([["All", ""], ["Manga", "MANGA"], ["Light Novel", "NOVEL"], ["One Shot", "ONE_SHOT"]])
	let selectFormatManga = create("select", "meter", false, apManga)
	mapFormatManga.forEach((_, key) => {
		let option = create("option", false, key, selectFormatManga)
		option.value = key
	})

	let apMangaCheckboxContainer = create("label","el-checkbox",false,apManga);
	let apMangaOverwrite = createCheckbox(apMangaCheckboxContainer);
	create("span","el-checkbox__label","Overwrite manga already on my list",apMangaCheckboxContainer);
	let apMangaDropzone = create("div","dropbox",false,apManga);
	let apMangaInput = create("input","input-file",false,apMangaDropzone);
	let apMangaDropText = create("p",false,"Drop list JSON file here or click to upload",apMangaDropzone);
	apMangaInput.type = "file";
	apMangaInput.name = "json";
	apMangaInput.accept = "application/json";
	let resultsArea = create("div","importResults",false,target);
	let resultsErrors = create("div",false,false,resultsArea,"color:red;padding:5px;");
	let resultsWarnings = create("div",false,false,resultsArea,"color:orange;padding:5px;");
	let resultsStatus = create("div",false,false,resultsArea,"padding:5px;");
	let missingList = create("div",false,false,resultsArea,"padding:5px;");
	let exportErrors = create("button",["hohButton","button", "danger"],"Export all errors and unchecked",resultsArea,"display: none; margin: 5px 10px")
	let uncheckedTitles = [];
	exportErrors.onclick = function() {
		var link = create("a")
		let dataTitles = ""
		uncheckedTitles.forEach(title => {
			dataTitles += `Unchecked title : ${title}\n`			
		})
		link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(dataTitles + "\n" + missingList.innerText.replace(/[\n\r]+/g, "\n"))
		link.download =  "errors_ap_import.txt"
		link.click()
	}
	let pushResults = create("button",["hohButton","button"],"Import all selected",resultsArea,"display: none; margin: 5px 10px")
	let resultsTable = create("div",false,false,resultsArea);

	let selectedValues = {}

	let apImport = function(type,file){
		let reader = new FileReader();
		reader.readAsText(file,"UTF-8");
		reader.onload = function(evt){
			let data;
			try{
				data = JSON.parse(evt.target.result)
			}
			catch(e){
				resultsErrors.innerText = "error parsing JSON";
			}
			if(data.export.type !== type){
				resultsErrors.innerText = "error wrong list";
				return;
			}
			if(data.user.name.toLowerCase() !== whoAmI.toLowerCase()){
				resultsWarnings.innerText = "List for \"" + data.user.name + "\" loaded, but currently signed in as \"" + whoAmI + "\". Are you sure this is right?"
			}
			if((new Date()) - (new Date(data.export.date)) > 1000*86400*30){
				resultsWarnings.innerText += "\nThis list is " + Math.round(((new Date()) - (new Date(data.export.date)))/(1000*86400)) + " days old. Did you upload the right one?"
			}
			resultsStatus.innerText = "Trying to find matching media...";
			let shows = [];
			let drawShows = function(){
				removeChildren(resultsTable);
				shows = shows.filter(a => {
					if(a.titles.length){
						return true
					}
					else{
						create("p", false, "No matches found for " + a.apData.name, missingList, "color: rgba(var(--color-peach), .8)")
						exportErrors.style.display = "inline"
						return false
					}
				});
				shows.sort(
					(b,a) => a.titles[0].levDistance - b.titles[0].levDistance
				);
				shows.forEach(show => {
					let row = create("div","hohImportRow",false,resultsTable);
					if(show.isAnthology){
						create("div","hohImportEntry",show.apData.map(a => a.name).join(", "),row)
					}
					else{
						create("div","hohImportEntry",show.apData.name,row)
					}
					create("span","hohImportArrow","→",row);
					let aniEntry = create("div", "hohImportSelect", false, row);

					let selectEntry = create("select", "#typeSelect", false, aniEntry, "width: 100%; white-space: nowrap; text-overflow: ellipsis")

					let images = {}
					show.titles.forEach(title => {
						let optionEntry = create("option", false, title.title + " (" + title.format + ")", selectEntry)
						optionEntry.value = title.id
						images[title.id] = title.cover
					})

					selectedValues[show.apData.name] = parseInt(selectEntry.value)
					let aniLink = create("a", ["hohButton","button","link","newTab"], "View", row, "margin: 0 10px")
					aniLink.href = "/" + type + "/" + parseInt(selectEntry.value)

					const image = create("img", false, false, row, "margin-right: 10px")
					image.src = images[selectEntry.value]

					selectEntry.onchange = () => { 
						selectedValues[show.apData.name] = parseInt(selectEntry.value)
						aniLink.href = "/" + type + "/" + parseInt(selectEntry.value)
						image.src = images[selectEntry.value]
					}

					let button = createCheckbox(row);
					row.style.backgroundColor = "hsl(" + (120 - Math.min(show.titles[0].levDistance,12)*10) + ",30%,50%)";
					if(show.titles[0].levDistance > 8){
						button.checked = false;
						show.toImport = false;
						uncheckedTitles = uncheckedTitles.filter(e => e !== show.apData.name)
						uncheckedTitles.push(show.apData.name)
					}
					else{
						button.checked = true;
						show.toImport = true;
					}
					button.oninput = function(){
						show.toImport = button.checked
						if(!show.toImport) uncheckedTitles.push(show.apData.name)
						else uncheckedTitles = uncheckedTitles.filter(e => e !== show.apData.name)
					}
				})
			};
			const apAnthologies = m4_include(data/AnimePlanet_anthologies.json);
			const apMappings_anime = m4_include(data/AnimePlanet_mappings_anime.json);
			const apMappings_manga = m4_include(data/AnimePlanet_mappings_manga.json);
			let bigQuery = [];
			let myFastMappings = [];
			data.entries.forEach(function(entry,index){
				if(entry.status === "won't watch"){
					return
				}
				if(apAnthologies[entry.name]){
					let already = myFastMappings.findIndex(function(mapping){
						return mapping.id === apAnthologies[entry.name]
					});
					if(already !== -1){
						myFastMappings[already].entries.push(entry)
					}
					else{
						myFastMappings.push({
							entries: [entry],
							isAnthology: true,
							id: apAnthologies[entry.name]
						})
					}
					return;
				}
				if(type === "manga"){
					if(apMappings_manga[entry.name]){
						myFastMappings.push({
							entries: [entry],
							id: apMappings_manga[entry.name]
						})
						return;
					}
				}
				else{
					if(apMappings_anime[entry.name]){
						myFastMappings.push({
							entries: [entry],
							id: apMappings_anime[entry.name]
						})
						return;
					}
				}

				const chosenFormat = type === "manga" ? mapFormatManga.get(selectFormatManga.value) : mapFormatAnime.get(selectFormatAnime.value)
				const formatInQuery = chosenFormat === "" ? "" : `format:${chosenFormat}`
				bigQuery.push({
					query: `query($search:String){Page(perPage:5){media(type:${type.toUpperCase()},search:$search,${formatInQuery}){title{romaji english native} id synonyms format coverImage{medium}}}}`,
					variables: {search: entry.name},
					callback: function(dat){
						let show = {
							apData: entry,
							aniData: dat.data.Page.media,
							titles: []
						}
						show.aniData.forEach(function(hit){
							show.titles.push({
								title: hit.title.romaji,
								id: hit.id,
								levDistance: Math.min(
									levDist(show.apData.name,hit.title.romaji),
									levDist(show.apData.name,hit.title.romaji.toUpperCase()),
									levDist(show.apData.name,hit.title.romaji.toLowerCase())
								),
								format: hit.format,
								cover: hit.coverImage.medium
							});
							if(hit.title.english){
								show.titles.push({
									title: hit.title.english,
									id: hit.id,
									levDistance: Math.min(
										levDist(show.apData.name,hit.title.english),
										levDist(show.apData.name,hit.title.english.toUpperCase()),
										levDist(show.apData.name,hit.title.english.toLowerCase())
									),
									format: hit.format,
									cover: hit.coverImage.medium
								});
							}
							if(hit.title.native){
								show.titles.push({
									title: hit.title.native,
									id: hit.id,
									levDistance: levDist(show.apData.name,hit.title.native),
									format: hit.format,
									cover: hit.coverImage.medium
								})
							}
							hit.synonyms.forEach(
								synonym => show.titles.push({
									title: synonym,
									id: hit.id,
									levDistance: levDist(show.apData.name,synonym),
									format: hit.format,
									cover: hit.coverImage.medium
								})
							)
						});

						const groupBy = (arr) => arr.reduce((prev, cur) => ((prev[cur.cover] = prev[cur.cover] || []).push(cur), prev), {})
						const min = (arr) => Math.min(...arr.map(res => res.levDistance))
						const findTitle = (cover, levDistance) => show.titles.find(element => element.cover === cover && element.levDistance === levDistance)

						show.titles = Object.entries(groupBy(show.titles)).map(([key, val]) => {
							const levDistance = min(val)
							return { id: findTitle(key, levDistance).id, levDistance: levDistance, title: findTitle(key, levDistance).title, format: findTitle(key, levDistance).format, cover: key }
						})
						
						const getMapIndex = (map, format) => {
							let indexMap;
							[...map].some(([_, val], index) => {
								if(val === format) { 
									indexMap = index
									return true
								}
								return false
							})
							return indexMap
						}

						show.titles.sort(
							(a,b) => {
								const distance = a.levDistance - b.levDistance
								if(distance === 0) {
									const mapFormat = type === "manga" ? mapFormatManga : mapFormatAnime
									let indexA = getMapIndex(mapFormat, a.format)
									let indexB = getMapIndex(mapFormat, b.format)
									return indexA - indexB
								}
								return distance
							});
					
						shows.push(show);
						drawShows();
					}
				});
				if(index % 40 === 0){
					queryPacker(bigQuery);
					bigQuery = [];
				}
			});
			let apStatusMap = {
				"want to read": "PLANNING",
				"stalled": "PAUSED",
				"read": "COMPLETED",
				"reading": "CURRENT",
				"watched": "COMPLETED",
				"want to watch": "PLANNING",
				"dropped": "DROPPED",
				"watching": "CURRENT"
			}
			queryPacker(bigQuery,function(){
				setTimeout(function(){
					resultsStatus.innerText = "Please review the media matches. The worst matches are on top.";
					pushResults.style.display = "inline";
					pushResults.onclick = function(){
						pushResults.style.display = "none";
						if(!useScripts.accessToken){
							alert("Not signed in with the script. Can't do any changes to your list\n Go to settings > apps to sign in");
							return;
						}
						authAPIcall(
						`query($name: String,$listType: MediaType){
							Viewer{name mediaListOptions{scoreFormat}}
							MediaListCollection(userName: $name, type: $listType){
								lists{
									entries{
										mediaId
									}
								}
							}
						}`,
						{
							listType: type.toUpperCase(),
							name: whoAmI
						},
						function(data){
							if(data.data.Viewer.name !== whoAmI){
								alert("Signed in as\"" + whoAmI + "\" to Anilist, but as \"" + data.data.Viewer.name + "\" to the script.\n Go to settings > apps, revoke " + script_type + "'s permissions, and sign in with the scirpt again to fix this.");
								return;
							}
							let list = returnList(data,true).map(a => a.mediaId);
							shows = shows.filter(show => {
								if(!show.toImport){
									return false;
								}
								if(type === "anime"){
									if(!apAnimeOverwrite.checked && list.includes(selectedValues[show.apData.name])){
										return false;
									}
								}
								else{
									if(!apMangaOverwrite.checked && list.includes(selectedValues[show.apData.name])){
										return false;
									}
								}
								return true;
							});
							if(!shows.length){
								resultsStatus.innerText = "No entries imported. All the entries already exist in your AniList account."
								return;
							}
							let importSuccess = 0
							let mutater = function(show,index){
								if(index + 1 < shows.length){
									setTimeout(function(){
										mutater(shows[index + 1],index + 1);
									},1000);
								}
								let status = false;
								if(show.isAnthology){
									status = "CURRENT";
								}
								else{
									status = apStatusMap[show.apData.status];
								}
								if(!status){
									console.log("Unknown status \"" + show.apData.status + "\" for " + show.apData.name)
									let unknownStatus = create("p",false, "Unknown status \"" + show.apData.status + "\" for " + show.apData.name, false, "color: rgba(var(--color-orange), .8)")
									missingList.insertBefore(unknownStatus, missingList.firstChild)
									exportErrors.style.display = "inline"
									resultsStatus.innerText = index + 1 === shows.length ? `Import completed !\n${importSuccess} of ${shows.length} entries successfully imported.`
										: `Importing : ${index + 1} of ${shows.length} entries. Closing this tab will stop the import.\n${importSuccess} of ${shows.length} entries successfully imported.`
									return;
								}
								let score = 0;
								if(!show.isAnthology){
									score = show.apData.rating*2;
									if(data.data.Viewer.mediaListOptions.scoreFormat === "POINT_100"){
										score = show.apData.rating*20;
									}
									else if(data.data.Viewer.mediaListOptions.scoreFormat === "POINT_5"){
										score = Math.floor(show.apData.rating);
										if(show.apData.rating === 0.5){
											score = 1
										}
									}
									else if(data.data.Viewer.mediaListOptions.scoreFormat === "POINT_3"){
										if(show.apData.rating === 0){
											score = 0
										}
										else if(show.apData.rating < 2.5){
											score = 1
										}
										else if(show.apData.rating < 4){
											score = 2
										}
										else{
											score = 3
										}
									}
								}
								let progress = 0;
								let progressVolumes = 0;
								let repeat = 0;
								if(show.isAnthology){
									progress = show.apData.length
								}
								else{
									repeat = Math.max(0,show.apData.times - 1) || 0;
									if(status === "DROPPED" || status === "PAUSED" || status === "CURRENT"){
										if(type === "anime"){
											progress = show.apData.eps
										}
										else{
											progress = show.apData.ch
										}
									}
								}
								if(type === "manga"){
									progressVolumes = show.apData.vol
								}
								if(progress || progressVolumes){
									authAPIcall(
										`mutation(
											$mediaId: Int,
											$status: MediaListStatus,
											$score: Float,
											$progress: Int,
											$progressVolumes: Int,
											$repeat: Int
										){
											SaveMediaListEntry(
												mediaId: $mediaId,
												status: $status,
												score: $score,
												progress: $progress,
												progressVolumes: $progressVolumes,
												repeat: $repeat
											){
												id
											}
										}`,
										{
											mediaId: selectedValues[show.apData.name],
											status: status,
											score: score,
											progress: progress,
											progressVolumes: progressVolumes,
											repeat: repeat
										},
										data => {
											if(data.errors){
												const title = show.titles.find(element => element.id === selectedValues[show.apData.name]).title
												resultsErrors.innerText += JSON.stringify(data.errors.map(e => e.validation)) + " " + title + "\n"
											}
										}
									)
								}
								else{
									authAPIcall(
										`mutation(
											$mediaId: Int,
											$status: MediaListStatus,
											$score: Float,
											$repeat: Int
										){
											SaveMediaListEntry(
												mediaId: $mediaId,
												status: $status,
												score: $score,
												repeat: $repeat
											){
												id
											}
										}`,
										{
											mediaId: selectedValues[show.apData.name],
											status: status,
											score: score,
											repeat: repeat
										},
										data => {
											if(data.errors){
												const title = show.titles.find(element => element.id === selectedValues[show.apData.name]).title
												resultsErrors.innerText += JSON.stringify(data.errors.map(e => e.validation)) + " " + title +  "\n"
											}
										}
									)
								}
								importSuccess += 1
								resultsStatus.innerText = index + 1 === shows.length ? `Import completed !\n${importSuccess} of ${shows.length} entries successfully imported.`
									: `Importing : ${index + 1} of ${shows.length} entries. Closing this tab will stop the import.\n${importSuccess} of ${shows.length} entries successfully imported.`
							};
							mutater(shows[0],0);
						})
					};
				},2000);
			});
			bigQuery = [];
			myFastMappings.forEach(function(entry){
				bigQuery.push({
					query: `query($id:Int){Media(type:${type.toUpperCase()},id:$id){title{romaji english native} id format coverImage{medium}}}`,
					variables: {id: entry.id},
					callback: function(dat){
						const media =  dat.data.Media
						const titles = [{title: media.title.romaji,id: entry.id,levDistance: 0,format: media.format,cover: media.coverImage.medium}]
						if(entry.isAnthology){
							let show = {
								apData: entry.entries,
								directMapping: true,
								isAnthology: true,
								aniData: media,
								titles: titles
							}
							shows.push(show);
							drawShows();
						}
						else{
							let show = {
								apData: entry.entries[0],
								directMapping: true,
								aniData: media,
								titles: titles
							}
							shows.push(show);
							drawShows();
						}
					}
				})
			});
			queryPacker(bigQuery);
		}
		reader.onerror = function(evt){
			resultsErrors.innerText = "error reading file"
		}
	}
	apAnimeInput.onchange = function(){
		apImport("anime",apAnimeInput.files[0])
	}
	apMangaInput.onchange = function(){
		apImport("manga",apMangaInput.files[0])
	}
	create("hr","hohSeparator",false,target,"margin-bottom: 40px;");
	let userNameContainer = create("div",false,false,target,"margin-bottom: 20px;");
	let userNameLabel = create("span",false,"User: ",userNameContainer);
	let userName = create("input","hohNativeInput",false,userNameContainer);
	userName.value = whoAmI;
	
	let alAnimeExp = create("div",["section","hohImport"],false,target);
	create("h2",false,"AniList: Export Anime List",alAnimeExp);
	let alAnimeButton = create("button",["button","hohButton"],"Export Anime",alAnimeExp);
	alAnimeButton.onclick = function(){
		generalAPIcall(
			backupQueryAnime,
			{name: userName.value},
			function(data){
				if(!data){
					alert("Export failed");
					return
				}
				data.data.version = "1.02";
				data.data.scriptInfo = scriptInfo;
				data.data.type = "ANIME";
				data.data.url = document.URL;
				data.data.timeStamp = NOW();
				saveAs(data.data,"AnilistAnimeList.json");
			}
		);
	}
	create("h2",false,"AniList: Export Manga List",alAnimeExp,"margin-top:20px;");
	let alMangaButton = create("button",["button","hohButton"],"Export Manga",alAnimeExp);
	alMangaButton.onclick = function(){
		generalAPIcall(
			backupQueryManga,
			{name: userName.value},
			function(data){
				if(!data){
					alert("Export failed");
					return
				}
				data.data.version = "1.02";
				data.data.scriptInfo = scriptInfo;
				data.data.type = "MANGA";
				data.data.url = document.URL;
				data.data.timeStamp = NOW();
				saveAs(data.data,"AnilistMangaList.json");
			}
		);
	};
	let malExport = function(data,type){//maybe some time? But there's always malscraper, which does it better
		let xmlContent = "";
		saveAs(xmlContent,type.toLowerCase() + "list_0_-_0.xml",true);
	}
	let alAnime = create("div",["section","hohImport"],false,target);
	create("h2",false,"Anilist JSON: Import Anime List",alAnime);
	let alAnimeCheckboxContainer = create("label","el-checkbox",false,alAnime,"display:none;");
	let alAnimeOverwrite = createCheckbox(alAnimeCheckboxContainer);
	create("span","el-checkbox__label","Overwrite anime already on my list",alAnimeCheckboxContainer);
	let alAnimeDropzone = create("div","dropbox",false,alAnime);
	let alAnimeInput = create("input","input-file",false,alAnimeDropzone);
	let alAnimeDropText = create("p",false,"Drop list JSON file here or click to upload",alAnimeDropzone);
	alAnimeInput.type = "file";
	alAnimeInput.name = "json";
	alAnimeInput.accept = "application/json";
	let alManga = create("div",["section","hohImport"],false,target);
	create("h2",false,"Anilist JSON: Import Manga List",alManga);
	let alMangaCheckboxContainer = create("label","el-checkbox",false,alManga,"display:none;");
	let alMangaOverwrite = createCheckbox(alMangaCheckboxContainer);
	create("span","el-checkbox__label","Overwrite manga already on my list",alMangaCheckboxContainer);
	let alMangaDropzone = create("div","dropbox",false,alManga);
	let alMangaInput = create("input","input-file",false,alMangaDropzone);
	let alMangaDropText = create("p",false,"Drop list JSON file here or click to upload",alMangaDropzone);
	alMangaInput.type = "file";
	alMangaInput.name = "json";
	alMangaInput.accept = "application/json";
	let resultsAreaAL = create("div","importResults",false,target);
	let resultsErrorsAL = create("div",false,false,resultsAreaAL,"color:red;padding:5px;");
	let resultsWarningsAL = create("div",false,false,resultsAreaAL,"color:orange;padding:5px;");
	let resultsStatusAL = create("div",false,false,resultsAreaAL,"padding:5px;");
	let pushResultsAL = create("button",["hohButton","button"],"Import all",resultsAreaAL,"display:none;");
	let resultsTableAL = create("div",false,false,resultsAreaAL);
	let alImport = function(type,file){
		let reader = new FileReader();
		reader.readAsText(file,"UTF-8");
		reader.onload = function(evt){
			let data;
			try{
				data = JSON.parse(evt.target.result)
			}
			catch(e){
				resultsErrorsAL.innerText = "error parsing JSON";
			}
			if(hasOwn(data, "user")){
				resultsErrorsAL.innerText = "This is the Anilist JSON importer, but you uploaded a GDPR JSON file. You either uploaded the wrong file, or ment to use the importer further down the page.";
				return;
			}
			if(parseFloat(data.version) > 1){//was not part of 1.00
				if(data.type !== type.toUpperCase()){
					resultsErrorsAL.innerText = "error wrong list type";
					return;
				}
			}
			//version 1.01: added type ANIME or MANGA to list files
			//version 1.02: added rowOrder and animeList and mangaList on mediaListOptions
			if(data.User.name.toLowerCase() !== whoAmI.toLowerCase()){
				resultsWarningsAL.innerText = "List for \"" + data.User.name + "\" loaded, but currently signed in as \"" + whoAmI + "\". Are you sure this is right?"
			}
			if((new Date()) - (new Date(data.timeStamp)) > 1000*86400*30){
				resultsWarningsAL.innerText += "\nThis list is " + Math.round(((new Date()) - (new Date(data.timeStamp)))/(1000*86400)) + " days old. Did you upload the right one?"
			}
			if(!useScripts.accessToken){
				resultsWarningsAL.innerText += "\nNot signed in to the script! Can't do any changes to your list then. Go to the bottom of the settings > apps page to sign in"
			}
			resultsStatusAL.innerText = "Calculating list differences...";
			if((type === "anime" && alAnimeOverwrite.checked) || (type === "manga" && alMangaOverwrite.checked)){
				alert("Haven't gotten around to support overwriting yet, sorry!")
			}
			else{
				authAPIcall(
					`query($name:String!,$listType:MediaType){
						Viewer{name mediaListOptions{scoreFormat}}
						MediaListCollection(userName:$name,type:$listType){
							lists{
								entries{mediaId}
							}
						}
					}`,
					{
						name: whoAmI,
						listType: type.toUpperCase()
					},
					data2 => {
						if(!data2){
							resultsErrorsAL.innerText = "Could not access the list of " + whoAmI + " do you have persmission to modify this list? (try signing in at settings > apps, scroll down to the bottom)";
							return
						}
						if(data2.data.Viewer.name !== whoAmI){
							alert("Signed in as\"" + whoAmI + "\" to Anilist, but as \"" + data2.data.Viewer.name + "\" to the script.\n Go to settings > apps, revoke " + script_type + "'s permissions, and sign in with the script again to fix this.");
							return
						}
						let existing = new Set(data2.data.MediaListCollection.lists.map(list => list.entries).flat().map(entry => entry.mediaId));
						let dataList = returnList({data: data},true);
						let already = dataList.filter(entry => existing.has(entry.mediaId)).length;
						let notAlready = dataList.filter(entry => !existing.has(entry.mediaId));
						resultsStatusAL.innerText += "\n" + already + " of " + dataList.length + " entries already on list. Not modifying";
						if(notAlready.length > 0){
							resultsStatusAL.innerText += "\nThe " + notAlready.length + " entries below will be added:";
							pushResultsAL.style.display = "inline";
							notAlready.forEach(show => {
								let row = create("p",false,false,resultsTableAL);
								create("a",false,show.media.title.romaji,row)
									.href = "https://anilist.co/" + type + "/" + show.mediaId
							});
							pushResultsAL.onclick = function(){
								pushResultsAL.style.display = "none";



							let mutater = function(show,index){
								if(index + 1 < notAlready.length){
									setTimeout(function(){
										mutater(notAlready[index + 1],index + 1);
									},1000);
								}
								try{
									authAPIcall(
										`mutation($startedAt: FuzzyDateInput,$completedAt: FuzzyDateInput,$notes: String){
											SaveMediaListEntry(
												mediaId: ${show.mediaId},
												status: ${show.status},
												score: ${show.score},
												progress: ${show.progress},
												progressVolumes: ${show.progressVolumes || 0},
												repeat: ${show.repeat},
												priority: ${show.priority},
												notes: $notes,
												startedAt: $startedAt,
												completedAt: $completedAt
											){id}
										}`,
										{
											startedAt: show.startedAt,
											completedAt: show.completedAt,
											notes: show.notes
										},
										data => {}
									)
								}
								catch(e){
									resultsWarningsAL.innerText += "\nAn error occured for mediaID " + show.mediaID;
								}
								resultsStatusAL.innerText = (index + 1) + " of " + notAlready.length + " entries imported. Closing this tab will stop the import.";
							};
							mutater(notAlready[0],0);



							}
						}
					}
				)
			}
		}
		reader.onerror = function(evt){
			resultsErrors.innerText = "error reading file"
		}
	}
	alAnimeInput.onchange = function(){
		pushResultsAL.style.display = "none";
		removeChildren(resultsTableAL);
		alImport("anime",alAnimeInput.files[0])
	}
	alMangaInput.onchange = function(){
		pushResultsAL.style.display = "none";
		removeChildren(resultsTableAL);
		alImport("manga",alMangaInput.files[0])
	}

	create("hr","hohSeparator",false,target,"margin-bottom:40px;");
	let gdpr_import = create("div",["section","hohImport"],false,target);
	create("h2",false,"GDPR data: Import lists",gdpr_import);
	let gdpr_importCheckboxContainer = create("label","el-checkbox",false,gdpr_import);
	let gdpr_importOverwrite = createCheckbox(gdpr_importCheckboxContainer);
	create("span","el-checkbox__label","Overwrite entries already on my list (only overwrite mode implemented so far)",gdpr_importCheckboxContainer);
	let gdpr_importDropzone = create("div","dropbox",false,gdpr_import);
	let gdpr_importInput = create("input","input-file",false,gdpr_importDropzone);
	let gdpr_importDropText = create("p",false,"Drop GDPR JSON file here or click to upload",gdpr_importDropzone);
	gdpr_importInput.type = "file";
	gdpr_importInput.name = "json";
	gdpr_importInput.accept = "application/json";

	let resultsAreaGDPR = create("div","importResults",false,target);
	let resultsErrorsGDPR = create("div",false,false,resultsAreaGDPR,"color:red;padding:5px;");
	let resultsWarningsGDPR = create("div",false,false,resultsAreaGDPR,"color:orange;padding:5px;");
	let resultsStatusGDPR = create("div",false,false,resultsAreaGDPR,"padding:5px;");
	let pushResultsGDPR = create("button",["hohButton","button"],"Import all",resultsAreaGDPR,"display:none;");
	let resultsTableGDPR = create("div",false,false,resultsAreaGDPR);

	gdpr_importInput.onchange = function(){
		let file = gdpr_importInput.files[0];
		let reader = new FileReader();
		reader.readAsText(file,"UTF-8");
		resultsStatusGDPR.innerText = "Loading GDPR JSON file...";
		reader.onload = function(evt){
			resultsStatusGDPR.innerText = "";
			let data;
			try{
				data = JSON.parse(evt.target.result)
			}
			catch(e){

				resultsErrorsGDPR.innerText = "error parsing JSON";
				return
			}
			if(hasOwn(data, "User")){
				resultsErrorsAL.innerText = "This is the GDPR JSON importer, but you uploaded a Anilist JSON file. You either uploaded the wrong file, or ment to use the importer further up the page.";
				return
			}
			if(data.user.display_name.toLowerCase() !== whoAmI.toLowerCase()){
				resultsWarningsGDPR.innerText = "List for \"" + data.user.display_name + "\" loaded, but currently signed in as \"" + whoAmI + "\". Are you sure this is right?"
			}
			if(!useScripts.accessToken){
				resultsWarningsGDPR.innerText += "\nNot signed in to the script! Can't do any changes to your lists then. Go to the bottom of the settings > apps page to sign in"
			}

			if(!gdpr_importOverwrite.checked){
				gdpr_importOverwrite.onclick = function(){
					alert("Non-overwrite mode already selected! Reload this page to start the import in another mode\n(Starting the import now WILL NOT overwrite existing list entries)")
				}
				resultsStatusGDPR.innerText = "Loading anime list...";
				authAPIcall(
					`query($name: String,$listType: MediaType){
						Viewer{name mediaListOptions{scoreFormat}}
						MediaListCollection(userName: $name, type: $listType){
							lists{
								entries{
									mediaId
								}
							}
						}
					}`,
					{
						listType: "ANIME",
						name: whoAmI
					},
					function(dataAnime){
						resultsStatusGDPR.innerText = "";
						if(!dataAnime){
							resultsErrorsGDPR.innerText = "An error occured while loading your anime list";
							return;
						}
						if(dataAnime.data.Viewer.name !== whoAmI){
							alert("Signed in as\"" + whoAmI + "\" to Anilist, but as \"" + data.data.Viewer.name + "\" to the script.\n Go to settings > apps, revoke " + script_type + "'s permissions, and sign in with the scirpt again to fix this.");
							return;
						}
						let listAnime = new Set(returnList(dataAnime,true).map(a => a.mediaId));
						resultsStatusGDPR.innerText = "Loading manga list...";
						authAPIcall(
							`query($name: String,$listType: MediaType){
								Viewer{name mediaListOptions{scoreFormat}}
								MediaListCollection(userName: $name, type: $listType){
									lists{
										entries{
											mediaId
										}
									}
								}
							}`,
							{
								listType: "MANGA",
								name: whoAmI
							},
							function(dataManga){
								resultsStatusGDPR.innerText = "";
								if(!dataManga){
									resultsErrorsGDPR.innerText = "An error occured while loading your manga list";
									return;
								}
								let listManga = new Set(returnList(dataManga,true).map(a => a.mediaId));

								pushResultsGDPR.style.display = "inline";
								let filtered_list = data.lists.filter(a => !(listAnime.has(a.series_id) || listManga.has(a.series_id)));
								resultsTableGDPR.innerText = filtered_list.length + " list items will be imported (" + (data.lists.length - filtered_list.length) + " items already on list will not be imported).\nEstimated time to import: " + Math.ceil(filtered_list.length/60) + " minutes.\nBrowsing Anilist while the import is running is not recommended.\nClosing this tab will immediately stop the import.";
								resultsTableGDPR.style.marginTop = "10px";

								let mutater = function(index){
									if(index + 1 < filtered_list.length){
										setTimeout(function(){
											mutater(index + 1);
										},1000);
									}
									try{
										let show = filtered_list[index];
										authAPIcall(
											`mutation($startedAt: FuzzyDateInput,$completedAt: FuzzyDateInput,$notes: String){
												SaveMediaListEntry(
													mediaId: ${show.series_id},
													status: ${["CURRENT","PLANNING","COMPLETED","DROPPED","PAUSED","REPEATING"][show.status]},
													score: ${show.score},
													progress: ${show.progress},
													progressVolumes: ${show.progress_volume || 0},
													repeat: ${show.repeat},
													priority: ${show.priority},
													notes: $notes,
													startedAt: $startedAt,
													completedAt: $completedAt
												){id}
											}`,
											{
												startedAt: {
													year: parseInt((show.started_on + "").slice(0,4)),
													month: parseInt((show.started_on + "").slice(4,6)),
													day: parseInt((show.started_on + "").slice(6,8)) 
												},
												completedAt: {
													year: parseInt((show.finished_on + "").slice(0,4)),
													month: parseInt((show.finished_on + "").slice(4,6)),
													day: parseInt((show.finished_on + "").slice(6,8)) 
												},
												notes: show.notes
											},
											data => {
												if(!data){
													throw "expected API to return ID"
												}
											}
										)
									}
									catch(e){
										resultsWarningsGDPR.innerText += "\nAn error occured for mediaID " + filtered_list[index].series_id + ": " + e
									}
									resultsStatusGDPR.innerText = (index + 1) + " of " + filtered_list.length + " entries imported"
								};
								pushResultsGDPR.onclick = function(){
									mutater(0)
								}
							}
						)
					}
				)
			}
			else{
				gdpr_importOverwrite.onclick = function(){
					alert("Overwrite mode already selected! Reload this page to start the import in another mode\n(Starting the import now WILL overwrite existing list entries!!!)")
				}
				pushResultsGDPR.style.display = "inline";
				resultsTableGDPR.innerText = data.lists.length + " list items will be imported.\nEstimated time to import: " + Math.ceil(data.lists.length/60) + " minutes.\nBrowsing Anilist while the import is running is not recommended.\nClosing this tab will immediately stop the import.";
				resultsTableGDPR.style.marginTop = "10px";

				let mutater = function(index){
					if(index + 1 < data.lists.length){
						setTimeout(function(){
							mutater(index + 1);
						},1000);
					}
					try{
						let show = data.lists[index];
						authAPIcall(
							`mutation($startedAt: FuzzyDateInput,$completedAt: FuzzyDateInput,$notes: String){
								SaveMediaListEntry(
									mediaId: ${show.series_id},
									status: ${["CURRENT","PLANNING","COMPLETED","DROPPED","PAUSED","REPEATING"][show.status]},
									score: ${show.score},
									progress: ${show.progress},
									progressVolumes: ${show.progress_volume || 0},
									repeat: ${show.repeat},
									priority: ${show.priority},
									notes: $notes,
									startedAt: $startedAt,
									completedAt: $completedAt
								){id}
							}`,
							{
								startedAt: {
									year: parseInt((show.started_on + "").slice(0,4)),
									month: parseInt((show.started_on + "").slice(4,6)),
									day: parseInt((show.started_on + "").slice(6,8)) 
								},
								completedAt: {
									year: parseInt((show.finished_on + "").slice(0,4)),
									month: parseInt((show.finished_on + "").slice(4,6)),
									day: parseInt((show.finished_on + "").slice(6,8)) 
								},
								notes: show.notes
							},
							data => {
								if(!data){
									throw "expected API to return ID"
								}
							}
						)
					}
					catch(e){
						resultsWarningsGDPR.innerText += "\nAn error occured for mediaID " + data.lists[index].series_id + ": " + e
					}
					resultsStatusGDPR.innerText = (index + 1) + " of " + data.lists.length + " entries imported"
				};
				pushResultsGDPR.onclick = function(){
					mutater(0)
				}
			}
		}
	}
}
//end modules/moreImports.js
//begin modules/navbarDroptext.js
if(useScripts.navbarDroptext){
	let addDrop = function(){
		let navThingy = document.querySelector(".nav");
		if(navThingy){
			navThingy.ondragover = function(event){
				event.preventDefault()
			}
			navThingy.ondrop = function(event){
				event.preventDefault();
				let data = event.dataTransfer.getData("text");
				if(data.length && data.length < 1000){//avoid performance issues if someone accidentally drops the lord of the rings script into the navbar or something
					document.querySelector(".nav .wrap .search").click();
					let observer = new MutationObserver(function(){
						let inputElement = document.querySelector(".nav .quick-search .input input");
						inputElement.value = data;
						inputElement.dispatchEvent(new Event("input"));
						observer.disconnect()
					});
					observer.observe(document.querySelector(".nav .quick-search"),{
						attributes: true,
						childList: false,
						subtree: false
					})
				}
			}
		}
		else{
			setTimeout(addDrop,500)
		}
	};addDrop()
}
//end modules/navbarDroptext.js
//begin modules/newChapters.js
let newChaptersInsertion = function(extraFilters){
//called from modules/drawListStuff.js
let buttonFindChapters = create("button",["hohButton","button"],translate("$button_newChapters"),extraFilters,"display:block;");
buttonFindChapters.title = "Check if there are new chapters available for things you are reading";
buttonFindChapters.onclick = function(){
	const URLstuff = location.pathname.match(/^\/user\/(.+)\/(animelist|mangalist)/);
	if(!URLstuff){
		return
	}
	let scrollableContent = createDisplayBox("min-width:400px;height:500px;");
	let loader = create("p",false,translate("$scanning"),scrollableContent,"cursor:wait;");
	let bannedEntries = new Set();
	if(useScripts.bannedUpdates){
		useScripts.bannedUpdates.forEach(item => {
			bannedEntries.add(item.id)
		})
	}
	let banMode = false;
	generalAPIcall(`
	query($name: String!){
		MediaListCollection(userName: $name, type: MANGA){
			lists{
				entries{
					mediaId
					status
					media{
						status(version: 2)
					}
				}
			}
		}
	}`,
	{name: decodeURIComponent(URLstuff[1])},
	function(data){
		if(!data){
			loader.innerText = translate("$error_connection");
			return
		}
		let list = returnList(data,true).filter(a => a.status === "CURRENT" && a.media.status === "RELEASING");
		let returnedItems = 0;
		let goodItems = [];
		let banContainer = create("div",false,false,scrollableContent.parentNode,"position:absolute;bottom:10px;left:10px");
		let banButton = create("button","hohButton","Ban items",banContainer);
		let banManager = create("button","hohButton","Manage bans",banContainer);
		banButton.onclick = function(){
			banMode = !banMode;
			if(banMode){
				banButton.innerText = "Click items to ban them";
				scrollableContent.classList.add("banMode")
			}
			else{
				banButton.innerText = "Ban items";
				scrollableContent.classList.remove("banMode")
			}
		}
		banManager.onclick = function(){
			let manager = createDisplayBox("min-width:400px;height:500px;top:100px;left:220px");
			create("h3",false,"Banned entries:",manager);
			if(!useScripts.bannedUpdates || useScripts.bannedUpdates.length == "0"){
				create("p",false,"no banned items",manager);
				return
			}
			useScripts.bannedUpdates.forEach(function(item){
				let listing = create("p","hohNewChapter",false,manager);
				create("a",["link","newTab"],item.title,listing)
					.href = "/manga/" + item.id + "/" + safeURL(item.title) + "/";
				let chapterClose = create("span","hohDisplayBoxClose",svgAssets.cross,listing);
				chapterClose.onclick = function(){
					listing.remove();
					bannedEntries.delete(item.id);
					useScripts.bannedUpdates.splice(useScripts.bannedUpdates.findIndex(a => a.id === item.id));
					useScripts.save()
				}
			})
		}
		let checkListing = function(data){
			returnedItems++;
			if(returnedItems === list.length){
				loader.innerText = "";
				if(!goodItems.length){
					loader.innerText = translate("$updates_noNewManga")
				}
			}
			if(!data){
				return
			}
			let guesses = [];
			let userIdCache = new Set();
			data.data.Page.activities.forEach(function(activity){
				if(activity.progress){
					let chapterMatch = parseInt(activity.progress.match(/\d+$/)[0]);
					if(!userIdCache.has(activity.userId) && chapterMatch !== 65535){
						guesses.push(chapterMatch);
						userIdCache.add(activity.userId)
					}
				}
			});
			guesses.sort(VALUE_DESC);
			if(guesses.length){
				let bestGuess = guesses[0];
				if(guesses.length > 2){
					if(guesses.filter(val => val < 7000).length){
						guesses = guesses.filter(val => val < 7000)
					}
					let diff = guesses[0] - guesses[1];
					let inverseDiff = 1 + Math.ceil(20/(diff+1));
					if(guesses.length >= inverseDiff){
						if(guesses[1] === guesses[inverseDiff]){
							bestGuess = guesses[1]
						}
					}
				}
				if(hasOwn(commonUnfinishedManga, data.data.MediaList.media.id)){
					if(bestGuess < commonUnfinishedManga[data.data.MediaList.media.id].chapters){
						bestGuess = commonUnfinishedManga[data.data.MediaList.media.id].chapters
					}
				}
				let bestDiff = bestGuess - data.data.MediaList.progress;
				if(bestDiff > 0 && (bestDiff < 30 || list.length <= 30)){
					goodItems.push({data:data,bestGuess:bestGuess});
					removeChildren(scrollableContent)
					goodItems.sort((b,a) => a.data.data.MediaList.score - b.data.data.MediaList.score);
					goodItems.forEach(function(item){
						let media = item.data.data.MediaList.media;
						if(bannedEntries.has(media.id)){
							return
						}
						let listing = create("p","hohNewChapter",false,scrollableContent);
						let title = titlePicker(media);
						let countPlace = create("span","count",false,listing,"width:110px;display:inline-block;");
						let progress = create("span",false,item.data.data.MediaList.progress + " ",countPlace);
						let guess = create("span",false,"+" + (item.bestGuess - item.data.data.MediaList.progress),countPlace,"color:rgb(var(--color-green));");
						progress.style.cursor = "pointer";
						progress.title = "Open list editor";
						progress.onclick = function(){
							if(banMode){
								return
							}
							document.getElementById("app").__vue__.$store.dispatch("medialistEditor/open",media.id)
						}
						if(useScripts.accessToken){
							guess.style.cursor = "pointer";
							guess.title = "Increment progress by 1";
							guess.onclick = function(){
								if(banMode){
									return
								}
								item.data.data.MediaList.progress++;
								authAPIcall(
									`mutation($id: Int,$progress: Int){
										SaveMediaListEntry(mediaId: $id,progress: $progress){id}
									}`,
									{
										id: media.id,
										progress: item.data.data.MediaList.progress
									},
									function(fib){
										if(!fib){
											item.data.data.MediaList.progress--;
											progress.innerText = item.data.data.MediaList.progress + " ";
											guess.innerText = "+" + (item.bestGuess - item.data.data.MediaList.progress)
										}
									}
								);
								progress.innerText = item.data.data.MediaList.progress + " ";
								if(item.bestGuess - item.data.data.MediaList.progress > 0){
									guess.innerText = "+" + (item.bestGuess - item.data.data.MediaList.progress)
								}
								else{
									guess.innerText = ""
								}
							}
						}
						create("a",["link","newTab"],title,listing)
							.href = "/manga/" + media.id + "/" + safeURL(title) + "/";
						let chapterClose = create("span","hohDisplayBoxClose",svgAssets.cross,listing);
						chapterClose.onclick = function(){
							if(banMode){
								return
							}
							listing.remove();
							bannedEntries.add(media.id)
						};
						listing.onclick = function(){
							if(banMode){
								if(bannedEntries.has(media.id)){
									bannedEntries.delete(media.id);
									listing.style.background = "inherit";
									useScripts.bannedUpdates.splice(useScripts.bannedUpdates.findIndex(item => item.id === media.id),1)
								}
								else {
									bannedEntries.add(media.id);
									listing.style.background = "rgb(var(--color-peach))";
									if(!useScripts.bannedUpdates){
										useScripts.bannedUpdates = []
									}
									useScripts.bannedUpdates.push({
										id: media.id,
										title: title
									})
								}
								useScripts.save()
							}
						}
					})
					create("p","hohNewChapter",false,scrollableContent)//spacer
				}
			}
		};
		let bigQuery = [];
		let queryList = [];
		list.forEach(function(entry,index){
			if(!bannedEntries.has(entry.mediaId)){
				bigQuery.push({
					query: `
query($id: Int,$userName: String){
	Page(page: 1){
		activities(
			mediaId: $id,
			sort: ID_DESC
		){
			... on ListActivity{
				progress
				userId
			}
		}
	}
	MediaList(
		userName: $userName,
		mediaId: $id
	){
		progress
		score
		media{
			id
			title{romaji native english}
		}
	}
}`,
					variables: {
						id: entry.mediaId,
						userName: decodeURIComponent(URLstuff[1])
					},
					callback: checkListing
				})
			}
			if((index % 2) === 0){
				queryList.push(bigQuery);
				bigQuery = []
			}
		});
		queryPacker(bigQuery);
		queryList.forEach((littleBig,index) => {
			setTimeout(function(){queryPacker(littleBig)},index * 100)
		})
	})
}
}
//end modules/newChapters.js
//begin modules/noAutoplay.js
exportModule({
	id: "noAutoplay",
	description: "$noAutoplay_description",
	extendedDescription: "$noAutoplay_extendedDescription",
	isDefault: false,
	categories: ["Feeds"],
	visible: true
})

if(useScripts.noAutoplay){
	setInterval(function(){
		document.querySelectorAll("video").forEach(video => {
			if(video.hasAttribute("autoplay")){
				if(!(video.querySelector("source") && video.querySelector("source").src.match(/#image$/))){
					video.removeAttribute("autoplay");
					video.load()
				}
				else{
					video.removeAttribute("controls")
				}
			}
		})
	},500)
}
//end modules/noAutoplay.js
//begin modules/noScrollPosts.js
exportModule({
	id: "noScrollPosts",
	description: "$noScrollPosts_description",
	isDefault: false,
	importance: -2,
	categories: ["Feeds"],
	visible: true,
	css: ".activity-text .text .markdown{max-height: unset}"
})
//end modules/noScrollPosts.js
//begin modules/noSequel.js
const sequelList = new Set(m4_include(data/sequels.json))
const sequelList_manga = new Set(m4_include(data/sequels_manga.json))

exportModule({
	id: "noSequel",
	description: "$noSequel_description",
	extendedDescription: "$noSequel_extendedDescription",
	isDefault: true,
	importance: 1,
	categories: ["Browse","Newly Added"],
	visible: true,
	urlMatch: function(){
		return /^\/search\/anime/.test(location.pathname) || /^\/search\/manga/.test(location.pathname)
	},
	code: function(){
		let optionInserter = function(){
			if(!(/^\/search\/anime/.test(location.pathname) || /^\/search\/manga/.test(location.pathname))){
				return
			}
			let place = document.querySelector(".primary-filters .filters");
			if(!place){
				setTimeout(optionInserter,500);
				return
			}
			place.style.position = "relative";
			if(document.querySelector(".hohNoSequelSetting")){
				return
			}
			let setting = create("span","hohNoSequelSetting",false,place);
			let input = createCheckbox(setting);
			input.classList.add("hohNoSequelSetting_input");
			input.checked = useScripts.noSequel_value;
			input.onchange = function(){
				useScripts.noSequel_value = this.checked;
				useScripts.save();
			}
			create("span",false,translate("$hideSequels"),setting);
			let remover = setInterval(function(){
				if(!(/^\/search\/anime/.test(location.pathname) || /^\/search\/manga/.test(location.pathname))){
					clearInterval(remover);
					return
				}
				let input = document.querySelector(".hohNoSequelSetting_input");
				if(!input){
					clearInterval(remover);
					return
				}
				Array.from(document.querySelectorAll(".media-card")).forEach(hit => {
					const cover = hit.querySelector(".cover");
					if(!cover) return
					let link = "";
					if(cover.href) link = cover.href;
					else{
						let img = cover.querySelector(".image-link");
						if(img && img.href) link = img.href;
						else return
					}
					let id = link.match(/(anime|manga)\/(\d+)\//);
					if(id && id[2]){
						id = parseInt(id[2]);
						if((sequelList.has(id) || sequelList_manga.has(id) || link.match(/2nd|3rd|season-2|season-3/i)) && input.checked){
							hit.classList.add("hohHiddenSequel")
						}
						else{
							hit.classList.remove("hohHiddenSequel")
						}
					}
				})
			},500)
		};
		optionInserter()
	},
	css: ".hohHiddenSequel{display: none!important}"
})
//end modules/noSequel.js
//begin modules/nonJapaneseVoiceDefaults.js
exportModule({
	id: "nonJapaneseVoiceDefaults",
	description: "defaults to Chinese and Korean voice actors for non-Japanese shows",
	isDefault: true,
	categories: ["Media"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url.match(/\/anime\/.*\/characters\/?$/)
	},
	code: function(){
		let checker = function(){
			if(!document.URL.match(/\/anime\/.*\/characters\/?$/)){
				return
			}
			let sidebarInfo = document.querySelector(".sidebar .data-set .value");
			if(!sidebarInfo){
				setTimeout(checker,500);
				return
			}
			let country = sidebarInfo.innerText.match(/Chinese|South Korean|Taiwanese/);
			if(!country){
				return
			}
			let selector = document.querySelector('.language-select input[placeholder="Language"]');
			if(!selector){
				setTimeout(checker,500);
				return
			}
			//opens the dropdown, spawning the alternate options
			selector.click();
			let selection = function(){
				if(!document.URL.match(/\/anime\/.*\/characters\/?$/)){
					return
				}
				let dropdown = document.querySelector(".el-select-dropdown");
				if(!dropdown){
					setTimeout(selection,100);
					return
				}
				let options = Array.from(dropdown.querySelectorAll(".el-select-dropdown__item span"));
				if(options.length === 0){
					selector.click()
				}
				options.forEach(option => {
					if(
						(option.innerText === "Chinese" && (country[0] === "Chinese" || country[0] === "Taiwanese"))
						|| (option.innerText === "Korean" && country[0] === "South Korean")
					){
						option.click()
					}
				})
			};selection()
		};checker()
	}
})
//end modules/nonJapaneseVoiceDefaults.js
//begin modules/nonJumpScroll.js
// SPDX-FileCopyrightText: 2021 Reina
// SPDX-License-Identifier: MIT
/*
Copyright (c) 2021 Reina

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice (including the next paragraph) shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//updated code here: https://github.com/Reinachan/AniList-High-Contrast-Dark-Theme
exportModule({
	id: "nonJumpScroll",
	description: "$nonJumpScroll_description",
	isDefault: true,
	importance: 1,
	categories: ["Feeds"],
	visible: true,
	css: `
/* Scrollbar */
* {
	scrollbar-color: rgb(var(--color-blue)) rgba(0, 0, 0, 0.2);
	scrollbar-width: thin;
}
::-webkit-scrollbar {
	width: 4px;
	height: 8px;
}
::-webkit-scrollbar-button {
	display: none;
}
::-webkit-scrollbar-track {
	background-color: #1110;
	width: 0px;
}
::-webkit-scrollbar-track-piece {
	display: none;
}
::-webkit-scrollbar-thumb {
	background-color: rgb(var(--color-blue));
}
.activity-markdown .markdown {
	overflow-y: scroll !important;
	scrollbar-color: rgba(0, 0, 0, 0) rgba(0, 0, 0, 0);
}
.activity-markdown .markdown:hover {
	scrollbar-color: rgb(var(--color-blue)) rgba(0, 0, 0, 0);
}
.activity-markdown .markdown::-webkit-scrollbar-thumb,
.activity-markdown .markdown .about .content-wrap::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0);
}
.activity-markdown .markdown:hover::-webkit-scrollbar-thumb,
.activity-markdown .markdown .about .content-wrap:hover::-webkit-scrollbar-thumb {
	background-color: rgb(var(--color-blue));
}
::-webkit-scrollbar-corner {
	display: none;
}
/*::-webkit-resizer {
	display: none;
}*/
.about .content-wrap {
	overflow-y: scroll !important;
	scrollbar-color: rgba(0, 0, 0, 0) rgba(0, 0, 0, 0);
}
.about .content-wrap .markdown {
	overflow: hidden !important;
}
.about .content-wrap:hover {
	overflow-y: scroll !important;
	scrollbar-color: rgb(var(--color-blue)) rgba(0, 0, 0, 0);
}
.about .content-wrap .markdown::after {
	content: '';
	display: block;
	height: 10px;
	width: 10px;
}
.list-editor .custom-lists {
	overflow-y: auto;
}
.list-editor .custom-lists:hover {
	margin-right: 0;
}
`
})
//end modules/nonJumpScroll.js
//begin modules/notificationCake.js
function notificationCake(){
	let notificationDot = document.querySelector(".notification-dot");
	if(notificationDot && (!notificationDot.childElementCount)){
		authAPIcall(
			queryAuthNotifications,
			{page:1,name:whoAmI},
			function(data){
				if(!data){
					return
				}
				let Page = data.data.Page;
				let User = data.data.User;
				let types = [];
				let names = [];
				Page.notifications.slice(0,User.unreadNotificationCount).forEach(notification => {
					if(!notification.type){//probably obsolete, remove later
						notification.type = "THREAD_SUBSCRIBED"
					}
					if(notification.user && !useScripts.notificationColours[notification.type].supress){
						if(!notification.user || useScripts.softBlock.indexOf(notification.user.name) === -1){
							names.push((notification.user || {name:""}).name)
						}
					}
					if(!useScripts.notificationColours[notification.type] || !useScripts.notificationColours[notification.type].supress){
						if(!notification.user || useScripts.softBlock.indexOf(notification.user.name) === -1){
							types.push(notification.type)
						}
					}
				})
				if(types.length){
					let notificationCake = create("canvas","hohNotificationCake");
					notificationCake.width = 120;
					notificationCake.height = 120;
					notificationCake.style.width = "30px";
					notificationCake.style.height = "30px";
					notificationDot.innerText = "";
					notificationDot.style.background = "none";
					notificationDot.style.width = "30px";
					notificationDot.style.height = "30px";
					notificationDot.style.borderRadius = "0";
					notificationDot.style.left = "5px";
					notificationDot.style.marginRight = "-3px";
					notificationDot.appendChild(notificationCake);
					let cakeCtx = notificationCake.getContext("2d");
					cakeCtx.fillStyle = "red";
					cakeCtx.textAlign = "center";
					cakeCtx.fontWeight = "500";
					cakeCtx.font = 50 + "px sans-serif";
					types.forEach(function(type,i){
						cakeCtx.fillStyle = (useScripts.notificationColours[type] || {"colour":"rgb(247,191,99)","supress":false}).colour;
						cakeCtx.beginPath();
						cakeCtx.arc(
							60,60,
							40,
							Math.PI * (2*i/types.length - 0.5),
							Math.PI * (2*(i+1)/types.length - 0.5)
						);
						cakeCtx.lineTo(60,60);
						cakeCtx.closePath();
						cakeCtx.fill()
					});
					cakeCtx.fillStyle = "#fff2f2";
					cakeCtx.fillText(User.unreadNotificationCount,60,76);
					notificationCake.innerText = types.length;
					notificationCake.title = names.join("\n");
					let poller = function(){
						if(!document.querySelector(".hohNotificationCake")){
							try{
								notificationCake();
							}catch(err){ /*do nothing*/ }
						}
						else{
							setTimeout(poller,4000);
						}
					};poller();
					if(!document.querySelector(".hohDismiss") && useScripts.dismissDot){
						let dismisser = create("span","hohDismiss",".",notificationDot.parentNode);
						dismisser.title = "Dismiss notifications";
						dismisser.onclick = function(){
							authAPIcall("query{Notification(resetNotificationCount:true){... on ActivityLikeNotification{id}}}",{},function(data){
								dismisser.previousSibling.style.display = "none";
								dismisser.style.display = "none"
							})
						}
					}
				}
				else{
					notificationDot.style.display = "none";
					if(User.unreadNotificationCount){
						authAPIcall("query{Notification(resetNotificationCount:true){... on ActivityLikeNotification{id}}}",{},function(data){})
					}
				}
			}
		)
	}
}

if(useScripts.accessToken && !useScripts.mobileFriendly){
	setInterval(notificationCake,4*1000)
}
//end modules/notificationCake.js
//begin modules/notifications.js
exportModule({
	id: "notifications",
	description: "$setting_notifications",
	extendedDescription: `
Performs several changes to notifications:

- Similar consecutive notifications are grouped.
- Notifications get tagged with the cover image of the media they apply to. (or profile picture, if it's a status post)
- Notifications may have a preview of the comments on the activity.

If you for any reason need the default look, you can click the "Show default notifications" to the left on the page.
	`,
	isDefault: true,
	importance: 10,
	categories: ["Notifications","Login"],
	visible: true
})

let prevLength = 0;
let displayMode = "hoh";

let reasons = new Map();

function enhanceNotifications(forceFlag){
	//method: the real notifications are parsed, then hidden and a new list of notifications are created using a mix of parsed data and API calls.
	//alternative method: auth (not implemented)
	setTimeout(function(){
		if((location.pathname === "/notifications" || location.pathname === "/notifications#") && !(useScripts.accessToken && false)){
			enhanceNotifications()
		}
		else{
			prevLength = 0;
			displayMode = "hoh"
		}
	},300);
	if(displayMode === "native"){
		return
	}
	if(document.getElementById("hohNotifications") && !forceFlag){
		return
	}
	let possibleButton = document.querySelector(".reset-btn");
	if(possibleButton){
		if(!possibleButton.flag){
			possibleButton.flag = true;
			if(useScripts.additionalTranslation){
				possibleButton.childNodes[0].textContent = translate("$notifications_button_reset")
			}
			possibleButton.onclick = function(){
				Array.from(
					document.getElementById("hohNotifications").children
				).forEach(child => {
					child.classList.remove("hohUnread")
				})
			};
			let regularNotifications = create("span",false,svgAssets.envelope + " " + translate("$notifications_showDefault"),possibleButton.parentNode,"cursor: pointer;font-size: small");
			let setting = create("p",false,false,possibleButton.parentNode,"cursor: pointer;font-size: small");
			let checkbox = createCheckbox(setting);
			checkbox.checked = useScripts["hideLikes"];
			checkbox.targetSetting = "hideLikes";
			checkbox.onchange = function(){
				useScripts[this.targetSetting] = this.checked;
				useScripts.save();
				forceRebuildFlag = true;
				enhanceNotifications(true)
			};
			let description = create("span",false,translate("$notifications_hideLike"),setting);
			setting.style.fontSize = "small";
			let softBlockSpan = create("span",false,translate("$notifications_softBlock"),possibleButton.parentNode,"cursor: pointer;font-size: small;display: block;margin: 10px 0px;");
			softBlockSpan.onclick = function(){
				let manager = createDisplayBox("width:600px;height:500px;top:100px;left:220px","Soft block");
				create("p",false,translate("$notifications_softBlock_description1"),manager);
				create("p",false,translate("$notifications_softBlock_description1"),manager);
				create("p",false,translate("$notifications_softBlock_description1"),manager);
				let form = create("div",false,false,manager);
				create("span",false,"Username: ",form);
				let userInput = create("input","hohNativeInput",false,form);
				let userAdd = create("button","hohButton",translate("$button_add"),form,"margin-left: 10px");
				let userList = create("div",false,false,manager);
				let renderSoftBlock = function(){
					removeChildren(userList);
					useScripts.softBlock.forEach((user,index) => {
						let item = create("p",false,false,userList,"position: relative");
						create("span",false,user,item);
						let removeButton = create("span","hohDisplayBoxClose",svgAssets.cross,item,"top: 0px");
						removeButton.onclick = function(){
							useScripts.softBlock.splice(index,1);
							useScripts.save();
							renderSoftBlock();
							forceRebuildFlag = true;
							enhanceNotifications(true)
						}
					})
				}
				renderSoftBlock();
				userAdd.onclick = function(){
					if(userInput.value){
						useScripts.softBlock.push(userInput.value);
						renderSoftBlock();
						useScripts.save();
						userInput.value = "";
						forceRebuildFlag = true;
						enhanceNotifications(true)
					}
				}
			}
			if(useScripts.settingsTip){
				create("p",false,
`You can turn parts of the script on and off:
settings > apps.

You can also turn off this notice there.`,setting)
			}
			regularNotifications.onclick = function(){
				if(displayMode === "hoh"){
					displayMode = "native";
					let hohNotsToToggle = document.getElementById("hohNotifications");
					if(hohNotsToToggle){
						hohNotsToToggle.style.display = "none"
					}
					Array.from(
						document.getElementsByClassName("notification")
					).forEach(elem => {
						elem.style.display = "grid"
					})
					regularNotifications.innerText = svgAssets.envelope + " " + translate("$notifications_showHoh");
					setting.style.display = "none"
				}
				else{
					displayMode = "hoh";
					let hohNotsToToggle = document.getElementById("hohNotifications");
					if(hohNotsToToggle){
						hohNotsToToggle.style.display = "block"
					}
					Array.from(
						document.getElementsByClassName("notification")
					).forEach(elem => {
						elem.style.display = "none"
					})
					regularNotifications.innerText = svgAssets.envelope + " " + translate("$notifications_showDefault");
					setting.style.display = ""
				}
			};
			try{
				document.querySelector(".group-header + .link").onclick = function(){
					enhanceNotifications()
				}
			}
			catch(e){
				console.warn("Unexpected Anilist UI. Is " + script_type + " up to date?")
			}
		}
	}
	let commentCallback = function(data){
		let listOfComments = Array.from(document.getElementsByClassName("b" + data.data.Activity.id));
		listOfComments.forEach(function(comment){
			removeChildren(comment.children[1])
			comment.children[0].style.display = "block";
			data.data.Activity.replies.slice(
				(data.data.Activity.replies.length <= 50 ? 0 : data.data.Activity.replies.length - 30),
				data.data.Activity.replies.length
			).forEach(function(reply){
				let quickCom = create("div","hohQuickCom",false,comment.children[1]);
				let quickComName = create("span","hohQuickComName",reply.user.name,quickCom);
				if(reply.user.name === whoAmI){
					quickComName.classList.add("hohThisIsMe")
				}
				let quickComContent = create("span","hohQuickComContent",false,quickCom);
				quickComContent.innerHTML = DOMPurify.sanitize(reply.text) //reason for innerHTML: preparsed sanitized HTML from the Anilist API
				let quickComLikes = create("span","hohQuickComLikes","♥",quickCom);
				if(reply.likes.length > 0){
					quickComLikes.innerText = reply.likes.length + "♥";
					quickComLikes.title = reply.likes.map(a => a.name).join("\n")
				}
				reply.likes.forEach(like => {
					if(like.name === whoAmI){
						quickComLikes.classList.add("hohILikeThis")
					}
				});
				if(useScripts.accessToken){
					quickComLikes.style.cursor = "pointer";
					quickComLikes.onclick = function(){
						authAPIcall(
							"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
							{id: reply.id},
							function(data){
								if(!data){
									authAPIcall(//try again once if it fails
										"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
										{id: reply.id},
										data => {}
									)
								}
							}
						);
						if(reply.likes.some(like => like.name === whoAmI)){
							reply.likes.splice(reply.likes.findIndex(user => user.name === whoAmI),1);
							quickComLikes.classList.remove("hohILikeThis");
							if(reply.likes.length > 0){
								quickComLikes.innerText = reply.likes.length + "♥"
							}
							else{
								quickComLikes.innerText = "♥"
							}
						}
						else{
							reply.likes.push({name: whoAmI});
							quickComLikes.classList.add("hohILikeThis");
							quickComLikes.innerText = reply.likes.length + "♥"
						}
						quickComLikes.title = reply.likes.map(a => a.name).join("\n")
					}
				}
			});
			let loading = create("div",false,false,comment.children[1]);
			let statusInput = create("div",false,false,comment.children[1]);
			let inputArea = create("textarea",false,false,statusInput,"width: 99%;border-width: 1px;padding: 4px;border-radius: 2px;color: rgb(159, 173, 189);");
			let cancelButton = create("button",["hohButton","button"],"Cancel",statusInput,"background:rgb(31,35,45);display:none;color: rgb(159, 173, 189);");
			let publishButton = create("button",["hohButton","button"],"Publish",statusInput,"display:none;");
			inputArea.placeholder = translate("$placeholder_reply");
			inputArea.onfocus = function(){
				cancelButton.style.display = "inline";
				publishButton.style.display = "inline"
			};
			cancelButton.onclick = function(){
				inputArea.value = "";
				cancelButton.style.display = "none";
				publishButton.style.display = "none";
				document.activeElement.blur()
			};
			publishButton.onclick = function(){
				loading.innerText = translate("$publishingReply");
				authAPIcall(
					`mutation($text: String,$activityId: Int){
						SaveActivityReply(text: $text,activityId: $activityId){
							id
							user{name}
							likes{name}
							text(asHtml: true)
							createdAt
						}
					}`,
					{text: inputArea.value,activityId: data.data.Activity.id},
					function(retur){
						loading.innerText = "";
						data.data.Activity.replies.push({
							text: retur.data.SaveActivityReply.text,
							user: retur.data.SaveActivityReply.user,
							likes: retur.data.SaveActivityReply.likes,
							id: retur.data.SaveActivityReply.id
						});
						let saltedHam = JSON.stringify({
							data: data,
							time: NOW(),
							duration: 24*60*60*1000
						});
						localStorage.setItem("hohListActivityCall" + data.data.Activity.id,saltedHam);
						commentCallback(data);
					}
				);
				inputArea.value = "";
				cancelButton.style.display = "none";
				publishButton.style.display = "none";
				document.activeElement.blur()
			}
		})
	};
	let findAct = function(act){
		let modi = document.querySelector("#hohNotifications [href='" + act.href + "'");
		let ide = act.href.match(/(anime|manga)\/(\d+)\//);
		if(modi){
			modi.parentNode.querySelector(".hohDataChange").innerHTML = DOMPurify.sanitize(act.text);
			if(!modi.parentNode.querySelector(".reason-markdown")){
				if(ide && reasons.has(parseInt(ide[2]))){
					let text = reasons.get(parseInt(ide[2]));
					let anchor = modi.parentNode.querySelector(".hohDataChange").children[0];
					let cont = create("div","reason-markdown",false,anchor);
					let contCont = create("div","markdown",false,cont);
					create("p",false,text,contCont)
				}
			}
			else if(ide){
				reasons.set(parseInt(ide[2]),modi.parentNode.querySelector(".reason-markdown p").innerText)
			}
		}
	}
	let notificationDrawer = function(activities){
		let newContainer = document.getElementById("hohNotifications")
		if(newContainer){
			newContainer.remove()
		}
		newContainer = create("div","#hohNotifications");
		let notificationsContainer = document.querySelector(".notifications");
		if(!notificationsContainer){
			return
		}
		notificationsContainer.insertBefore(newContainer,notificationsContainer.firstChild);
		activities = activities.filter(
			activity => !(
				activity.textName
				&& useScripts.softBlock.includes(activity.textName)
			)
		);
		for(let i=0;i<activities.length;i++){
			if(useScripts.hideLikes && (activities[i].type === "likeReply" || activities[i].type === "like")){
				continue
			}
			let newNotification = create("div");
			newNotification.onclick = function(){
				this.classList.remove("hohUnread");
				let notiCount = document.getElementsByClassName("notification-dot");
				if(notiCount.length){
					const actualCount = parseInt(notiCount[0].textContent);
					if(actualCount < 2){
						if(possibleButton){
							possibleButton.click()
						}
					}
					else{
						notiCount[0].innerText = (actualCount - 1)
					}
				}
			};
			if(activities[i].unread){
				newNotification.classList.add("hohUnread")
			}
			newNotification.classList.add("hohNotification");
			let notImage = create("a","hohUserImage"); //container for profile images
			notImage.href = activities[i].href;
			notImage.style.backgroundImage = activities[i].image;
			let notNotImageContainer = create("span","hohMediaImageContainer"); //container for series images
			let text = create("a","hohMessageText");
			let textName = create("span");
			let textSpan = create("span");
			textName.style.color = "rgb(var(--color-blue))";
			let counter = 1;
			if(activities[i].type === "like"){
				for(
					counter = 0;
					i + counter < activities.length
					&& activities[i + counter].type === "like"
					&& activities[i + counter].href === activities[i].href;
					counter++
				){//one person likes several of your media activities
					let notNotImage = create("a",false,false,notNotImageContainer);
					create("img",["hohMediaImage",activities[i + counter].link],false,notNotImage);
					notNotImage.href = activities[i + counter].directLink;
					let possibleDirect = activities[i + counter].directLink.match(/activity\/(\d+)/);
					if(possibleDirect){
						cheapReload(notNotImage,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
					}
				}
				text.href = activities[i].directLink;
				let possibleDirect = activities[i].directLink.match(/activity\/(\d+)/);
				if(possibleDirect){
					cheapReload(text,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
				}
				textSpan.innerText = translate("$notification_likeActivity_1person_1activity");
				if(counter > 1){
					textSpan.innerText = translate("$notification_likeActivity_1person_Mactivity")
				}
				if(counter === 1){
					while(
						i + counter < activities.length
						&& activities[i + counter].type === "like"
						&& activities[i + counter].link === activities[i].link
					){//several people likes one of your activities
						let miniImageWidth = 40;
						let miniImage = create("a","hohUserImageSmall",false,newNotification);
						miniImage.href = activities[i + counter].href;
						miniImage.title = activities[i + counter].textName;
						miniImage.style.backgroundImage = activities[i + counter].image;
						miniImage.style.height = miniImageWidth + "px";
						miniImage.style.width = miniImageWidth + "px";
						miniImage.style.left = (72 + (counter - 1)*miniImageWidth) + "px";
						if(counter >= 8){
							miniImage.style.height = miniImageWidth/2 + "px";
							miniImage.style.width = miniImageWidth/2 + "px";
							miniImage.style.left = (72 + 7*miniImageWidth + Math.ceil((counter - 9)/2)/2 * miniImageWidth) + "px";
							if(counter % 2 === 1){
								miniImage.style.top = miniImageWidth/2 + "px"
							}
						}
						counter++;
					}
					if(counter === 2){
						text.style.marginTop = "45px";
						activities[i].textName += " & " + activities[i+1].textName;
						textSpan.innerText = translate("$notification_likeActivity_2person_1activity")
					}
					else if(counter > 2){
						text.style.marginTop = "45px";
						activities[i].textName += " +" + (counter - 1);
						textSpan.innerText = translate("$notification_likeActivity_Mperson_1activity")
					}
				}
				else{
					newNotification.classList.add("hohCombined")
				}
				textName.innerText = activities[i].textName;
				text.appendChild(textName);
				text.appendChild(textSpan);
				i += counter -1
			}
			else if(activities[i].type === "reply" ){
				let notNotImage = create("a",false,false,notNotImageContainer);
				create("img",["hohMediaImage",activities[i].link],false,notNotImage);
				notNotImage.href = activities[i].directLink;
				let samePerson = true;
				while(
					i + counter < activities.length
					&& activities[i + counter].type === "reply"
					&& activities[i + counter].link === activities[i].link
				){
					let miniImageWidth = 40;
					let miniImage = create("a","hohUserImageSmall",false,newNotification);
					miniImage.href = activities[i + counter].href;
					miniImage.style.backgroundImage = activities[i + counter].image;
					miniImage.style.height = miniImageWidth + "px";
					miniImage.style.width = miniImageWidth + "px";
					miniImage.style.left = (72 + (counter - 1)*miniImageWidth) + "px";
					if(counter >= 8){
						miniImage.style.height = miniImageWidth/2 + "px";
						miniImage.style.width = miniImageWidth/2 + "px";
						miniImage.style.left = (72 + 7*miniImageWidth + Math.ceil((counter - 9)/2)/2 * miniImageWidth) + "px";
						if(counter % 2 === 1){
							miniImage.style.top = miniImageWidth/2 + "px"
						}
					}
					if(activities[i].textName !== activities[i + counter].textName){
						samePerson = false
					}
					counter++
				}
				textSpan.innerText = translate("$notification_reply_1person_1reply");
				if(samePerson){
					if(counter > 1){
						text.style.marginTop = "45px";
						activities[i].textName += " x" + counter;
						textSpan.innerText = translate("$notification_reply_1person_1reply")
					}
				}
				else{
					if(counter === 2){
						text.style.marginTop = "45px";
						activities[i].textName += " & " + activities[i+1].textName;
						textSpan.innerText = translate("$notification_reply_2person_1reply")
					}
					else if(counter > 2){
						text.style.marginTop = "45px";
						activities[i].textName += " +" + (counter-1);
						textSpan.innerText = translate("$notification_reply_Mperson_1reply")
					}
				}
				text.href = activities[i].directLink;
				let possibleDirect = activities[i].directLink.match(/activity\/(\d+)/);
				if(possibleDirect){
					cheapReload(text,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
					cheapReload(notNotImage,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
				}
				textName.innerText = activities[i].textName;
				text.appendChild(textName);
				text.appendChild(textSpan);
				i += counter -1
			}
			else if(activities[i].type === "replyReply" ){
				let notNotImage = create("a",false,false,notNotImageContainer);
				create("img",["hohMediaImage",activities[i].link],false,notNotImage);
				notNotImage.href = activities[i].directLink;
				let samePerson = true;
				while(
					i + counter < activities.length
					&& activities[i + counter].type === "replyReply"
					&& activities[i + counter].link === activities[i].link
				){
					let miniImageWidth = 40;
					let miniImage = create("a","hohUserImageSmall",false,newNotification);
					miniImage.href = activities[i + counter].href;
					miniImage.title = activities[i + counter].textName;
					miniImage.style.backgroundImage = activities[i + counter].image;
					miniImage.style.height = miniImageWidth + "px";
					miniImage.style.width = miniImageWidth + "px";
					miniImage.style.left = (72 + (counter-1)*miniImageWidth) + "px";
					if(counter >= 8){
						miniImage.style.height = miniImageWidth/2 + "px";
						miniImage.style.width = miniImageWidth/2 + "px";
						miniImage.style.left = (72 + 7*miniImageWidth + Math.ceil((counter - 9)/2)/2 * miniImageWidth) + "px";
						if(counter % 2 === 1){
							miniImage.style.top = miniImageWidth/2 + "px"
						}
					}
					if(activities[i].textName !== activities[i + counter].textName){
						samePerson = false
					}
					counter++
				}
				textSpan.innerText = translate("$notification_replyReply_1person_1reply");
				if(samePerson){
					if(counter > 1){
						text.style.marginTop = "45px";
						activities[i].textName += " x" + counter
					}
				}
				else{
					if(counter === 2){
						text.style.marginTop = "45px";
						activities[i].textName += " & " + activities[i+1].textName
					}
					else if(counter > 2){
						text.style.marginTop = "45px";
						activities[i].textName += " +" + (counter-1)
					}
				}
				text.href = activities[i].directLink;
				let possibleDirect = activities[i].directLink.match(/activity\/(\d+)/);
				if(possibleDirect){
					cheapReload(text,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
					cheapReload(notNotImage,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
				}
				textName.innerText = activities[i].textName;
				text.appendChild(textName);
				text.appendChild(textSpan);
				i += counter -1
			}
			else if(
				activities[i].type === "likeReply"
			){
				let notNotImage = create("a",false,false,notNotImageContainer);
				create("img",["hohMediaImage",activities[i].link],false,notNotImage);
				notNotImage.href = activities[i].directLink;
				let samePerson = true;
				while(
					i + counter < activities.length
					&& activities[i + counter].type === "likeReply"
					&& activities[i + counter].link === activities[i].link
				){//several people likes one of your activity replies
					let miniImageWidth = 40;
					let miniImage = create("a","hohUserImageSmall",false,newNotification);
					miniImage.href = activities[i + counter].href;
					miniImage.title = activities[i + counter].textName;
					miniImage.style.backgroundImage = activities[i + counter].image;
					miniImage.style.height = miniImageWidth + "px";
					miniImage.style.width = miniImageWidth + "px";
					miniImage.style.left = (72 + (counter - 1)*miniImageWidth) + "px";
					if(counter >= 8){
						miniImage.style.height = miniImageWidth/2 + "px";
						miniImage.style.width = miniImageWidth/2 + "px";
						miniImage.style.left = (72 + 7*miniImageWidth + Math.ceil((counter - 9)/2)/2 * miniImageWidth) + "px";
						if(counter % 2 === 1){
							miniImage.style.top = miniImageWidth/2 + "px"
						}
					}
					if(activities[i].textName !== activities[i + counter].textName){
						samePerson = false
					}
					counter++
				}
				textSpan.innerText = translate("$notification_likeReply_1person_1reply");
				if(samePerson){
					if(counter > 1){
						text.style.marginTop = "45px";
						activities[i].textName += " x" + counter;
						textSpan.innerText = translate("$notification_likeReply_1person_Mreply")
					}
				}
				else{
					if(counter === 2){
						text.style.marginTop = "45px";
						activities[i].textName += " & " + activities[i+1].textName;
						textSpan.innerText = translate("$notification_likeReply_2person_1reply")
					}
					else if(counter > 2){
						text.style.marginTop = "45px";
						activities[i].textName += " +" + (counter-1);
						textSpan.innerText = translate("$notification_likeReply_Mperson_1reply")
					}
				}
				text.href = activities[i].directLink;
				let possibleDirect = activities[i].directLink.match(/activity\/(\d+)/);
				if(possibleDirect){
					cheapReload(text,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
					cheapReload(notNotImage,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
				}
				textName.innerText = activities[i].textName;
				text.appendChild(textName);
				text.appendChild(textSpan);
				i += counter -1
			}
			else if(
				activities[i].type === "message"
				|| activities[i].type === "mention"
			){
				let notNotImage = create("a",false,false,notNotImageContainer);
				create("img",["hohMediaImage",activities[i].link],false,notNotImage);
				notNotImage.href = activities[i].directLink;
				text.href = activities[i].directLink;
				let possibleDirect = activities[i].directLink.match(/activity\/(\d+)/);
				if(possibleDirect){
					cheapReload(text,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
					cheapReload(notNotImage,{name: "Activity", params: {id: parseInt(possibleDirect[1])}});
				}
				textName.innerText = activities[i].textName;
				if(activities[i].type === "message"){
					textSpan.innerText = translate("$notification_message")
				}
				else{
					textSpan.innerText = translate("$notification_mention")
				}
				text.appendChild(textName);
				text.appendChild(textSpan)
			}
			else if(activities[i].type === "airing"){
				textSpan.innerHTML = DOMPurify.sanitize(activities[i].text);//reason for innerHTML: preparsed sanitized HTML from the Anilist API
				text.appendChild(textSpan);
				if(useScripts.partialLocalisationLanguage !== "English"){
					let episodeNumber = parseInt(textSpan.childNodes[1].textContent.trim());
					let episodeLink = textSpan.childNodes[4].outerHTML;
					if(episodeNumber){
						textSpan.innerHTML = DOMPurify.sanitize(translate("$notification_airing",[episodeNumber,episodeLink]));//reason for innerHTML: preparsed sanitized HTML from the Anilist API
					}
				}
			}
			else if(activities[i].type === "follow"){
				text.href = activities[i].directLink;
				textName.innerText = activities[i].textName;
				textSpan.innerText = activities[i].textSpan;
				text.appendChild(textName);
				text.appendChild(textSpan)
			}
			else if(
				activities[i].type === "forumCommentLike"
				|| activities[i].type === "forumSubscribedComment"
				|| activities[i].type === "forumCommentReply"
				|| activities[i].type === "forumLike"
				|| activities[i].type === "forumMention"
			){
				text.href = activities[i].directLink;
				textName.innerText = activities[i].textName;
				textSpan.innerText = activities[i].textSpan;
				text.appendChild(textName);
				text.appendChild(textSpan);
				let textSpan2 = create("span",false,activities[i].text,text,"color:rgb(var(--color-blue));");
				if(activities[i].text === ""){
					if(activities[i].type === "forumSubscribedComment"){
						textSpan.innerText = " commented in your subscribed forum thread "
					}
					else if(activities[i].type === "forumCommentLike"){
						textSpan.innerText = " liked your comment, in a "
					}
					else if(activities[i].type === "forumCommentReply"){
						textSpan.innerText = " replied to your comment, in a "
					}
					else if(activities[i].type === "forumLike"){
						textSpan.innerText = " liked your "
					}
					else if(activities[i].type === "forumMention"){
						textSpan.innerText = " mentioned you, in a "
					}
					textSpan2.innerText = "[deleted thread]";
					text.href = "#"
				}
				if(activities[i].type === "forumCommentLike"){
					textSpan.innerText = translate("$notification_forumCommentLike")
				}
				else if(activities[i].type === "forumMention"){
					textSpan.innerText = translate("$notification_forumMention")
				}
				text.style.maxWidth = "none";
				text.style.marginTop = "17px"
			}
			else if(activities[i].type === "newMedia"){
				textSpan.classList.add("hohNewMedia");
				textSpan.innerHTML = DOMPurify.sanitize(activities[i].text);
				textSpan.querySelector(".context").innerText = translate("$notification_newMedia");
				text.appendChild(textSpan);
				notImage.style.width = "51px";
				text.href = activities[i].href
			}
			else if(activities[i].type === "dataChange"){
				textSpan.classList.add("hohDataChange");
				text.href = activities[i].href;
				notImage.classList.remove("hohUserImage");
				notImage.classList.add("hohBackgroundCover");
				textSpan.innerHTML = DOMPurify.sanitize(activities[i].text);//reason for innerHTML: preparsed sanitized HTML from the Anilist API
				text.style.marginTop = "10px";
				text.style.marginLeft = "10px";
				text.appendChild(textSpan)
			}
			else{//display as-is
				textSpan.classList.add("hohUnhandledSpecial");
				textSpan.innerHTML = DOMPurify.sanitize(activities[i].text);//reason for innerHTML: preparsed sanitized HTML from the Anilist API
				text.appendChild(textSpan)
			}
			newNotification.appendChild(notImage);
			newNotification.appendChild(text);
			newNotification.appendChild(notNotImageContainer);
			let time = create("div","hohTime");
			if(activities[i - counter + 1].time){
				time.appendChild(nativeTimeElement(activities[i - counter + 1].time))
			}
			newNotification.appendChild(time);
			let commentsContainer = create("div",["hohCommentsContainer","b" + activities[i].link]);
			let comments = create("a",["hohComments","link"],translate("$notifications_comments"),commentsContainer);
			create("span","hohMonospace","+",comments);
			comments.onclick = function(){
				if(this.children[0].innerText === "+"){
					this.children[0].innerText = "-";
					this.parentNode.children[1].style.display = "inline-block";
					let variables = {
						id: +this.parentNode.classList[1].substring(1)
					};
					generalAPIcall(queryActivity,variables,commentCallback,"hohListActivityCall" + variables.id,24*60*60*1000,true,true)
				}
				else{
					this.children[0].innerText = "+";
					this.parentNode.children[1].style.display = "none"
				}
			};
			let commentsArea = create("div","hohCommentsArea",false,commentsContainer);
			newNotification.appendChild(commentsContainer)
			newContainer.appendChild(newNotification)
		}
	};
	let activities = [];
	let notifications = document.getElementsByClassName("notification");//collect the "real" notifications
	if(notifications.length === prevLength && forceRebuildFlag === false){
		return
	}
	else{
		prevLength = notifications.length;
		forceRebuildFlag = false
	}
	const activityTypes = {
		" liked your activity." :                           "like",
		" replied to your activity." :                      "reply",
		" sent you a message." :                            "message",
		" liked your activity reply." :                     "likeReply",
		" mentioned you in their activity." :               "mention",
		" replied to activity you're subscribed to." :      "replyReply",
		" liked your comment, in the forum thread " :       "forumCommentLike",
		" commented in your subscribed forum thread " :     "forumSubscribedComment",
		" replied to your comment, in the forum thread " :  "forumCommentReply",
		" liked your forum thread, " :                      "forumLike",
		" mentioned you, in the forum thread " :            "forumMention"
	};
	let mutationConfig = {
		attributes: false,
		childList: true,
		subtree: false
	};
	let observer = new MutationObserver(function(){
		enhanceNotifications(true)
	});
	observer.observe(document.querySelector(".page-content .notifications"),mutationConfig);
	if(useScripts.accessToken && reasons.size === 0){
		authAPIcall(`query{
    Page{
    notifications(type_in:[MEDIA_DATA_CHANGE,MEDIA_MERGE,MEDIA_DELETION]){
      ... on MediaMergeNotification{
        reason mediaId
      }
      ... on MediaDeletionNotification{
        reason
      }
      ... on MediaDataChangeNotification{
        reason mediaId
      }
    }
  }
}`,{},function(data){
			data.data.Page.notifications.forEach(noti => {
				if(noti.mediaId){
					reasons.set(noti.mediaId,noti.reason)
				}
			});
		})
	}
	Array.from(notifications).forEach(function(notification){//parse real notifications
		notification.already = true;
		notification.style.display = "none";
		let active = {
			type: "special",
			unread: false,
			link: "aaa",//fixme. Edit 2019: I have no idea
			image: notification.children[0].style.backgroundImage,
			href: notification.children[0].href
		};
		if(
			notification.classList.length > 1
			&& notification.classList[1] !== "hasMedia"
		){//"notification unread" classlist
			active.unread = true
		}
		if(//check if we can query that
			notification.children.length >= 2
			&& notification.children[1].children.length
			&& notification.children[1].children[0].children.length
			&& notification.children[1].children[0].children[0].children.length
		){
			//TODO replace this with document.querySelector?
			const info = notification.children[1].children[0].children[0];
			if(info.href){
				active.directLink = info.href
				let linkMatch =     info.href.match(/activity\/(\d+)/);
				if(linkMatch){
					active.link = linkMatch[1]
				}
			}
			active.text =       info.innerHTML;//does not depend on user input
			active.textName =   (info.childNodes[0] || {textContent: ""}).textContent.trim();
			active.textSpan =   (info.childNodes[1] || {textContent: ""}).textContent;
			let testType = info.children[0].textContent;
			active.type = activityTypes[testType];
			if(!active.type){
				active.type = "special"
				//by default every activity is some weird thing we are displaying as-is
				//makes the transition more smooth every time Anilist introduces a new type of notification
			}
			else if(
				active.type === "forumCommentLike"
				|| active.type === "forumSubscribedComment"
				|| active.type === "forumCommentReply"
				|| active.type === "forumLike"
				|| active.type === "forumMention"
			){
				active.text = (info.children[1] || {textContent: ""}).textContent
			}
		}
		else{
			if(notification.innerText.includes("was recently added to the site")){
				active.type = "newMedia";
				active.text = notification.children[1].innerHTML
			}
			else if(notification.innerText.includes("received site data changes")){
				active.type = "dataChange";
				notification.querySelector(".expand-reason").click();
				setTimeout(function(){
					active.text = notification.children[1].innerHTML;
					findAct(active);
				},100);
			}
		}
		if(active.type === "special"){
			active.text = notification.children[1].innerHTML;//does not depend on user input
			if(notification.children[1].children.length){
				const info = notification.children[1].children[0];
				if(
					info.children.length >= 2
					&& (info.children[1] || {textContent: ""}).textContent === " started following you."
				){
					active.type = "follow";
					active.directLink = info.children[0].href;
					active.text =       info.children[0].innerHTML;//does not depend on user input
					active.textName =   (info.children[0] || {textContent: ""}).textContent.trim();
					active.textSpan =   translate("$notification_follow")
				}
				else if(
					info.children.length >= 4
					&& (info.children[3] || {textContent: ""}).textContent === " aired."
				){
					active.type = "airing";
					active.directLink = info.children[0].href;
					active.text = info.innerHTML;//does not depend on user input
				}
			}
		}
		if(
			notification.querySelector("time")
		){
			active.time = (new Date(notification.querySelector("time").dateTime).valueOf())/1000
		}
		else{
			active.time = null
		}
		activities.push(active)
	});
	notificationDrawer(activities);
	let alreadyRenderedComments = new Set();
	for(let i=0;APIcallsUsed < (APIlimit - 5);i++){//heavy
		if(!activities.length || i >= activities.length){//loading is difficult to predict. There may be nothing there when this runs
			break
		}
		let imageCallBack = function(data){
			if(!data){
				return
			}
			pending[data.data.Activity.id + ""] = false;
			let type = data.data.Activity.type;
			if(type === "ANIME_LIST" || type === "MANGA_LIST"){
				Array.from(document.getElementsByClassName(data.data.Activity.id)).forEach(stuff => {
					stuff.style.backgroundColor = data.data.Activity.media.coverImage.color || "rgb(var(--color-foreground))";
					stuff.src = data.data.Activity.media.coverImage.large;
					stuff.classList.add("hohBackgroundCover");
					if(data.data.Activity.media.title){
						stuff.parentNode.title = data.data.Activity.media.title.romaji
					}
				})
			}
			else if(type === "TEXT"){
				Array.from(document.getElementsByClassName(data.data.Activity.id)).forEach(stuff => {
					stuff.src = data.data.Activity.user.avatar.large;
					stuff.classList.add("hohBackgroundUserCover");
					stuff.parentNode.style.background = "none"
				})
			}
			if(data.data.Activity.replies.length){
				if(!alreadyRenderedComments.has(data.data.Activity.id)){
					alreadyRenderedComments.add(data.data.Activity.id);
					commentCallback(data)
				}
			}
		};
		let vars = {
			find: i
		};
		if(activities[i].link[0] !== "a"){//activities with post link
			let variables = {
				id: +activities[i].link
			};
			if(!pending[activities[i].link]){
				pending[activities[i].link] = true;
				generalAPIcall(queryActivity,variables,imageCallBack,"hohListActivityCall" + variables.id,24*60*60*1000,true)
			}
		}
	}
}

//end modules/notifications.js
//begin modules/oldDarkTheme.js
exportModule({
	id: "CSSoldDarkTheme",
	description: "$CSSoldDarkTheme_description",
	isDefault: false,
	importance: -3,
	categories: [],
	visible: true,
	css: `
.site-theme-dark{
	--color-background:39,44,56;
	--color-foreground:31,35,45;
	--color-foreground-grey:25,29,38;
	--color-foreground-grey-dark:16,20,25;
	--color-foreground-blue:25,29,38;
	--color-foreground-blue-dark:19,23,29;
	--color-background-blue-dark:31,35,45;
	--color-overlay:34,28,22;
	--color-shadow:49,54,68;
	--color-shadow-dark:6,13,34;
	--color-shadow-blue:103,132,187;
	--color-text:159,173,189;
	--color-text-light:129,140,153;
	--color-text-lighter:133,150,165;
	--color-text-bright:237,241,245;
}
.site-theme-dark .nav-unscoped.transparent{
	background: rgba(31, 38, 49, .5);
	color: rgb(var(--color-text));
}

.site-theme-dark .nav-unscoped,
.site-theme-dark .nav-unscoped.transparent:hover{
	background: rgb(var(--color-foreground));
}`
})
//end modules/oldDarkTheme.js
//begin modules/possibleBlocked.js
function possibleBlocked(oldURL){
	let URLstuff = oldURL.match(/\/user\/(.*?)\/?$/);
	if(URLstuff){
		let name = decodeURIComponent(URLstuff[1]);
		const query = `
		query($userName: String) {
			User(name: $userName){
				id
			}
		}`;
		let variables = {
			userName: name
		}
		if(name !== whoAmI){
			generalAPIcall(query,variables,data => {
				let notFound = document.querySelector(".not-found");
				name = name.split("/")[0];
				if(notFound){
					if(name.includes("submissions")){
						notFound.innerText = "This submission was probably denied"
					}
					else if(data){
						notFound.innerText = translate("$404_blocked",name)
					}
					else if(name === "ModChan"){
						notFound.innerText = "Nope."
					}
					else{
						notFound.innerText = translate("$404_private_or_noUser",name);
						generalAPIcall(
`
query($name: String){
	MediaList(userName: $name,mediaId: 1){
		id
	}
}
`,
							{name: name},
							function(data,variables,errors){
								if(errors){
									if(errors.errors[0].message === "Private User"){
										notFound.innerText = translate("$404_private",name)
									}
									else{
										notFound.innerText = translate("$404_noUser",name)
									}
								}
							}
						)
					}
					notFound.style.paddingTop = "200px";
					notFound.style.fontSize = "2rem"
				}
			})
		}
		return
	}
	URLstuff = oldURL.match(/\/(anime|manga)\/(\d+)/);
	if(URLstuff){
		let type = URLstuff[1];
		let id = parseInt(URLstuff[2]);
		const query = `
		query($id: Int,$type: MediaType) {
			Media(id: $id,type: $type){
				genres
			}
		}`;
		let variables = {
			type: type.toUpperCase(),
			id: id
		}
		generalAPIcall(query,variables,data => {
			if(data.data.Media.genres.some(genre => genre === "Hentai")){
				let notFound = document.querySelector(".not-found");
				if(notFound){
					if(id === 320){
						notFound.innerText = `Kite isn't *really* hentai, but it kinda is too, and it's a bit complicated.

(You can enable 18+ content in settings > Anime & Manga)`
					}
					else{
						notFound.innerText = `That's one of them hentais.

(You can enable 18+ content in settings > Anime & Manga)`
					}
					notFound.style.paddingTop = "200px";
					notFound.style.fontSize = "2rem"
				}
			}
		})
	}
}
//end modules/possibleBlocked.js
//begin modules/profileBackground.js
function profileBackground(){
	if(useScripts.SFWmode){//clearly not safe, users can upload anything
		return
	}
	const userRegex = /^\/user\/([^/]+)(\/.*)?$/;
	let URLstuff = location.pathname.match(userRegex);
	const query = `
	query($userName: String) {
		User(name: $userName){
			about
		}
	}`;
	let variables = {
		userName: decodeURIComponent(URLstuff[1])
	}
	generalAPIcall(query,variables,data => {
		if(!data){
			return;
		}
		let jsonMatch = (data.data.User.about || "").match(/^\[\]\(json([A-Za-z0-9+/=]+)\)/);
		if(!jsonMatch){
			let target = document.querySelector(".user-page-unscoped");
			if(target){
				target.style.background = "unset"
			}
			return;
		}
		try{
			let jsonData;
			try{
				jsonData = JSON.parse(atob(jsonMatch[1]))
			}
			catch(e){
				jsonData = JSON.parse(LZString.decompressFromBase64(jsonMatch[1]))
			}
			let adder = function(){
				if(!userRegex.test(location.pathname)){
					return
				}
				let target = document.querySelector(".user-page-unscoped");
				if(target){
					target.style.background = jsonData.background || "none";
				}
				else{
					setTimeout(adder,200);
				}
			};adder();
		}
		catch(e){
			console.warn("Invalid profile JSON for " + variables.userName + ". Aborting.");
			console.log(atob(jsonMatch[1]));
		}
	},"hohProfileBackground" + variables.userName,30*1000);
}
//end modules/profileBackground.js
//begin modules/randomButtons.js
exportModule({
	id: "randomButtons",
	description: "Make the headings on the site stats page lead to random entries",
	isDefault: true,
	categories: ["Script"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url === "https://anilist.co/site-stats";
	},
	code: function(){
		let list = [
			{data:"users",single:"user"},
			{data:"media(type: ANIME)",single:"anime"},
			{data:"media(type: MANGA)",single:"manga"},
			{data:"characters",single:"character"},
			{data:"staff",single:"staff"},
			{data:"reviews",single:"review"}
		];
		list.forEach(function(item,index){
			let adder = function(data){
				let place = document.querySelectorAll("section > .heading > h3");
				if(place.length <= index){
					setTimeout(function(){adder(data)},200);
					return;
				}
				let currentText = place[index].innerText;
				place[index].innerText = "";
				let link = create("a","link",currentText,place[index],"cursor:pointer;");
				link.title = "Click to pick one at random";
				let maximum = data.data.Page.pageInfo.total;
				let list = place[index].parentNode.parentNode.querySelectorAll(".point-label");
				let val = parseInt(list[list.length - 1].textContent.trim());
				if(val && val > 5000){
					maximum = val
				}
				let selected = Math.floor(Math.random()*maximum);
				link.onclick = function(){
					generalAPIcall(
						`query($page:Int){
							Page(page:$page){
								${item.data}{id}
							}
						}`,
						{page: Math.ceil(selected / 50)},
						function(data){
							window.location.href = "https://anilist.co/" + item.single + "/" + data.data.Page[item.data.replace(/\(.*\)/,"")][selected % 50].id + "/";
						}
					);
				}
			};
			generalAPIcall(
				`query($page:Int){
					Page(page:$page){
						pageInfo{total}
						${item.data}{id}
					}
				}`,
				{page: 1},
				adder
			)
		});
		let speedAdder = function(data){
			if(!data){
				return
			}
			let place = document.querySelector(".page-content .container section");
			if(!place){
				setTimeout(function(){speedAdder(data)},200);
				return;
			}
			let activityContainer = create("div",false,false,place.parentNode);
			create("h3","heading","Current Activity",activityContainer);
			create("p",false,Math.round((3600*199/(data.data.act1.activities[0].createdAt - data.data.act2.activities[data.data.act2.activities.length - 1].createdAt))) + " activities/hour",activityContainer);
			let activities = data.data.text.activities;
			create("p",false,(3600*(activities.length - 1)/(activities[0].createdAt - activities[activities.length - 1].createdAt)).roundPlaces(1) + " status posts/hour",activityContainer);
			activities = data.data.message.activities;
			create("p",false,(3600*(activities.length - 1)/(activities[0].createdAt - activities[activities.length - 1].createdAt)).roundPlaces(1) + " messages/hour",activityContainer);
			
		};
		generalAPIcall(
			`query{
				act1:Page(page: 1,perPage:10){
					activities(sort:ID_DESC){
						... on TextActivity{createdAt}
						... on MessageActivity{createdAt}
						... on ListActivity{createdAt}
					}
				}
				act2:Page(page: 20,perPage:10){
					activities(sort:ID_DESC){
						... on TextActivity{createdAt}
						... on MessageActivity{createdAt}
						... on ListActivity{createdAt}
					}
				}
				text:Page{
					activities(sort:ID_DESC,type:TEXT){
						... on TextActivity{createdAt}
					}
				}
				message:Page{
					activities(sort:ID_DESC,type:MESSAGE){
						... on MessageActivity{createdAt}
					}
				}
			}`,
			{},
			speedAdder
		)
	}
})
//end modules/randomButtons.js
//begin modules/rangeSetter.js
exportModule({
	id: "rangeSetter",
	description: "$rangeSetter_description",
	extendedDescription: "$rangeSetter_extendedDescription",
	isDefault: true,
	importance: 0,
	categories: ["Media","Newly Added","Lists","Login"],
	visible: true,
	css: `
.input-wrap .form.progress{
	position: relative;
}
.hohRangeSetter{
	width: 15px;
	height: 15px;
	position: absolute;
	right: -20px;
	top: 37.5px;
	background: rgb(var(--color-blue));
	border-radius: 2px;
	cursor: pointer;
}
`
})

if(useScripts.rangeSetter && useScripts.accessToken){
	setInterval(function(){
		let inputPlace = document.querySelector(".input-wrap .form.progress");
		if(inputPlace){
			if(inputPlace.querySelector(".hohRangeSetter")){
				return
			}
			let rangeSetter = create("div","hohRangeSetter",false,inputPlace);
			rangeSetter.title = "Click to set lower part of activity range";
			rangeSetter.style.display = "none";
			let realInput = inputPlace.querySelector("input");
			if(!realInput){
				return
			}
			let seriesID = null;//we need to gather this quickly!
			let possibleDirectMatch = document.URL.match(/\/(anime|manga)\/(\d+)/);
			if(possibleDirectMatch){
				seriesID = parseInt(possibleDirectMatch[2])
			}
			else{
				let secondPosition = inputPlace.parentNode.parentNode.parentNode.querySelector(".cover img");
				if(secondPosition && secondPosition.src.match(/cover\/.*\/[a-z]?[a-z]?(\d+)-/)){
					seriesID = parseInt(secondPosition.src.match(/cover\/.*\/[a-z]?[a-z]?(\d+)-/)[1]);
				}
				else{//oh no! pray the query is fast enough
					let title = inputPlace.parentNode.parentNode.parentNode.querySelector(".title").innerText;
					generalAPIcall(
`query{Media(search:"${title}"){id}}`,{},function(data){
							if(!data){
								return
							}
							seriesID = data.data.Media.id
						}
					)
				}
			}
			let changer = function(){
				if(!seriesID){
					return//too late!
				}
				if(!realInput.value){
					return
				}
				realInput.onclick = null;
				inputPlace.querySelector(".el-input-number__decrease").onclick = null;
				inputPlace.querySelector(".el-input-number__increase").onclick = null;
				rangeSetter.style.display = "block";
			}
			realInput.oninput = function(){
				changer()
			};
			inputPlace.querySelector(".el-input-number__decrease").onclick = function(){
				changer()
			}
			inputPlace.querySelector(".el-input-number__increase").onclick = function(){
				changer()
			}
			rangeSetter.onclick = function(){
				rangeSetter.onclick = null;
				authAPIcall(
					`mutation{
						SaveMediaListEntry(
							mediaId: ${seriesID},
							progress: ${parseInt(realInput.value)}
						){id}
					}`,
					{},
					data => {
						if(!data){
							rangeSetter.innerText = svgAssets.cross;
							rangeSetter.classList.add("spinnerError");
							rangeSetter.title = "Setting activity range failed"
						}
						else{
							rangeSetter.innerText = svgAssets.check;
							rangeSetter.classList.add("spinnerDone")
						}
					}
				);
				rangeSetter.innerText = "…";
				rangeSetter.style.background = "none";
				rangeSetter.style.cursor = "unset"
			}
		}
	},1000)
}
//end modules/rangeSetter.js
//begin modules/recommendationsFade.js
exportModule({
	id: "recommendationsFade",
	description: "$recommendationsFade_description",
	isDefault: false,
	importance: 0,
	categories: ["Media","Newly Added"],
	visible: true,
	css: ".recommendation-card .cover:has(.hohStatusDot):not(:hover){opacity: 0.3 !important;}"
})//end modules/recommendationsFade.js
//begin modules/reinaDark.js
// SPDX-FileCopyrightText: 2021 Reina
// SPDX-License-Identifier: MIT
/*
Copyright (c) 2021 Reina

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice (including the next paragraph) shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
//updated code here: https://github.com/Reinachan/AniList-High-Contrast-Dark-Theme
exportModule({
	id: "reinaDark",
	description: "$setting_reinaDark",
	extendedDescription: `
More info and standalone versions: https://anilist.co/activity/136403139

Github: https://github.com/Reinachan/AniList-High-Contrast-Dark-Theme
`,
	isDefault: true,
	importance: 1,
	categories: ["Script"],
	visible: true,
	css: `
.theme-preview.dark-contrast{
	border-radius: 3px;
	border: 2px solid #46546b;
	cursor: pointer;
	display: inline-block;
	font-weight: 500;
	height: 25px;
	margin-right: 10px;
	padding-left: 2px;
	padding-top: 5px;
	width: 25px;

	background: rgb(14, 18, 22);
	color: rgb(240, 240, 240);
}
`//not the actual theme itself, just the styling of the theme switch
})

//outside the actual module export, as we want to run this at page load
if(useScripts.reinaDark){
	let darkContrastStyle = create("style");
	darkContrastStyle.id = "high-contrast-dark";
	darkContrastStyle.type = "text/css";
	documentHead.appendChild(darkContrastStyle);
	const style = `
:root {
	--color-background: 14, 18, 22;
	--color-blue: 120, 180, 255;
	--color-shadow-blue: 0, 0, 0;
	--color-foreground: 20, 25, 31;
	--color-foreground-alt: 18, 23, 29;
	--color-foreground-blue: 26, 33, 45;
	--color-foreground-grey: 15, 22, 28;
	--color-foreground-grey-dark: 6, 12, 13;
	--color-background-300: 30, 42, 56;
	--color-background-100: 19, 24, 32;
	--color-background-200: 14, 18, 22;
	--color-text: 240, 240, 240;
	--color-text-light: 220, 230, 240;
	--color-text-lighter: 230, 230, 240;
	--color-text-bright: 255, 255, 255;
	--color-blue-100: 247, 250, 252;
	--color-blue-200: 236, 246, 254;
	--color-blue-300: 201, 232, 255;
	--color-blue-400: 143, 215, 255;
	--color-blue-500: 111, 200, 255;
	--color-blue-600: 61, 180, 242;
	--color-blue-700: 8, 143, 214;
	--color-blue-800: 12, 101, 166;
	--color-blue-900: 11, 70, 113;
	--color-blue-1000: 16, 61, 85;
	--color-gray-1200: 251, 251, 251;
	--color-gray-1100: 240, 243, 246;
	--color-gray-1000: 221, 230, 238;
	--color-gray-900: 201, 215, 227;
	--color-gray-800: 173, 192, 210;
	--color-gray-700: 139, 160, 178;
	--color-gray-600: 116, 136, 153;
	--color-gray-500: 100, 115, 128;
	--color-gray-400: 81, 97, 112;
	--color-gray-300: 30, 42, 56;
	--color-gray-100: 21, 31, 46;
	--color-gray-200: 11, 22, 34;
}
.site-theme-dark {
	--color-blue: 120, 180, 255;
	--color-shadow-blue: 8, 10, 16, 0.5;
	--color-foreground: 20, 25, 31;
	--color-foreground-alt: 18, 23, 29;
	--color-background: 14, 18, 22;
	--color-foreground-blue: 26, 33, 45;
	--color-foreground-grey: 15, 22, 28;
	--color-foreground-grey-dark: 6, 12, 13;
	--color-nav-hoh: rgb(20, 25, 31);
}
.site-theme-dark {
	/* Notification Dropdown */
	--color-background-300: 30, 42, 56;
	--color-background-100: 19, 24, 32;
	--color-background-200: 14, 18, 22;
	/* Text */
	--color-text: 240, 240, 240;
	--color-text-light: 220, 230, 240;
	--color-text-lighter: 230, 230, 240;
	--color-text-bright: 255, 255, 255;
	/* Blue Colours */
	--color-blue-100: 247, 250, 252;
	--color-blue-200: 236, 246, 254;
	--color-blue-300: 201, 232, 255;
	--color-blue-400: 143, 215, 255;
	--color-blue-500: 111, 200, 255;
	--color-blue-600: 61, 180, 242;
	--color-blue-700: 8, 143, 214;
	--color-blue-800: 12, 101, 166;
	--color-blue-900: 11, 70, 113;
	--color-blue-1000: 16, 61, 85;
}
/* Navbar */
#app .nav-unscoped {
	background: #14191f;
	color: #eaeeff;
}
#app .nav-unscoped.transparent {
	background: rgba(20, 25, 31, 0.5);
	color: #eaeeff;
}
#app .nav-unscoped.transparent:hover {
	background: #14191f;
	color: #eaeeff;
}
#app .nav-unscoped .dropdown::before {
	border-bottom-color: rgb(var(--color-background-100));
}
.nav[data-v-e2f25004] {
	background: #181a32;
}
.banner-image[data-v-e2f25004] {
	filter: grayscale(50%);
}
/* Mobile and small screens adjustments */
@media screen and (max-width: 760px) {
	.page-content > .container,
	.page-content > .user > .container {
		padding-left: 2px;
		padding-right: 2px;
	}
}
/* Increase font size */
@media screen and (max-width: 760px) {
	html {
		font-size: 11px;
	}
}
/* Enable edit button on mobile */
@media screen and (max-width: 760px) {
	.media.media-page-unscoped .sidebar {
		display: grid;
		gap: 20px;
		margin-bottom: 20px;
	}
	.media.media-page-unscoped .sidebar > * {
		grid-column: span 2;
	}
	.media.media-page-unscoped .sidebar .review.button {
		grid-row: 1;
		grid-column: 2;
		width: 100%;
		height: 40px;
		margin: 0;
		display: flex;
	}
	.media.media-page-unscoped .sidebar .review.button.edit {
		grid-column: 1;
	}
	.media.media-page-unscoped .sidebar .review.button.edit span::after {
		content: ' Database Entry';
	}
	.media.media-page-unscoped .sidebar .data {
		margin-bottom: 0;
	}
	.media.media-page-unscoped .sidebar .rankings {
		grid-row: 4;
		display: grid;
		gap: 10px;
	}
	.media.media-page-unscoped .sidebar .rankings .ranking {
		margin-bottom: 0;
	}
	.media.media-page-unscoped .sidebar .rankings .ranking.rated {
		grid-column: 1;
	}
	.media.media-page-unscoped .sidebar .rankings .ranking.popular {
		grid-column: 2;
	}
}
@media screen and (max-width: 450px) {
	.media.media-page-unscoped .sidebar .rankings .ranking.rated {
		grid-column: 1;
		grid-row: 1;
	}
	.media.media-page-unscoped .sidebar .rankings .ranking.popular {
		grid-column: 1;
		grid-row: 2;
	}
}
/* Profile page mobile edits */
@media screen and (max-width: 760px) {
	.user.user-page-unscoped .overview .section .about {
		padding: 10px;
	}
}
@media screen and (max-width: 1040px) {
	.tooltip {
		display: none !important;
	}
	.user.user-page-unscoped .overview .desktop {
		display: grid;
	}
	.user.user-page-unscoped .overview .desktop.favourites.preview .favourites-wrap {
		display: grid;
		grid-auto-flow: column;
		justify-content: unset;
		width: unset;
		margin: 0;
		overflow-x: scroll;
	}
	.user.user-page-unscoped .overview .desktop.favourites.preview .favourites-wrap a {
		margin: 0;
		margin-bottom: 10px;
	}
	.user.user-page-unscoped .overview .desktop.favourites.preview .favourites-wrap a:last-of-type {
		margin-right: 15px;
	}
	.user.user-page-unscoped .overview .desktop.favourites.preview .favourites-wrap.studios {
		display: flex;
		flex-wrap: nowrap;
	}
	.user.user-page-unscoped .overview .desktop.favourites.preview .favourites-wrap.studios a {
		flex-grow: 1;
		flex-shrink: 0;
		margin-bottom: 6px;
	}
	.user.user-page-unscoped .overview > .section:nth-of-type(2) .stats-wrap {
		display: none;
	}
}
/* Coloured Text */
.name[data-v-5e514b1e] {
	color: rgb(var(--color-blue));
}
.site-theme-dark .user-page-unscoped.pink {
	--color-blue: 252, 157, 214;
}
/* Dropdown menu arrows */
.el-dropdown-menu.el-popper[x-placement^='top'] .popper__arrow::after,
.el-select-dropdown.el-popper[x-placement^='top'] .popper__arrow::after {
	bottom: 0;
}
.el-dropdown-menu.el-popper[x-placement^='bottom'] .popper__arrow::after,
.el-select-dropdown.el-popper[x-placement^='bottom'] .popper__arrow::after {
	top: 0;
}
.el-dropdown-menu.el-popper .popper__arrow,
.el-select-dropdown.el-popper .popper__arrow,
.el-dropdown-menu.el-popper .popper__arrow::after,
.el-select-dropdown.el-popper .popper__arrow::after {
	border-top-color: rgb(var(--color-foreground-grey-dark));
	border-bottom-color: rgb(var(--color-foreground-grey-dark));
}
.el-dropdown-menu.el-popper.activity-extras-dropdown[x-placement^='top'] .popper__arrow::after {
	bottom: 0;
}
.el-dropdown-menu.el-popper.activity-extras-dropdown[x-placement^='bottom'] {
	transform: translateY(25px);
}
.el-dropdown-menu.el-popper.activity-extras-dropdown[x-placement^='bottom'] .popper__arrow {
	top: -5px;
}
/* Dropdown menu */
.el-dropdown-menu.el-popper {
	text-align: center;
	background-color: rgb(var(--color-foreground-grey-dark));
	box-shadow: 0 1px 10px 0 rgba(var(--color-shadow-blue));
}
.el-dropdown-menu.el-popper.el-dropdown-menu--medium {
	width: 150px;
}
.el-dropdown-menu.el-popper.el-dropdown-menu--medium.activity-extras-dropdown {
	text-align: left;
}
.el-dropdown-menu.el-popper.el-dropdown-menu--medium .el-dropdown-menu__item:hover {
	background-color: rgb(var(--color-foreground-alt)) !important;
}
.el-dropdown-menu.el-popper .el-dropdown-menu__item--divided {
	border-top: 3px solid rgb(var(--color-foreground-alt));
	margin: auto;
}
.el-dropdown-menu.el-popper .el-dropdown-menu__item--divided::before {
	background-color: rgb(var(--color-foreground-grey-dark)) !important;
}
/* List editor dropdown menu */
.el-select-dropdown.el-popper {
	background-color: rgb(var(--color-foreground-grey-dark)) !important;
}
.el-select-dropdown {
	box-shadow: 0 1px 10px 0 rgba(var(--color-shadow-blue));
}
.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
	background-color: rgb(var(--color-background)) !important;
}
/* Activity Textareas */
.activity-edit .input.el-textarea textarea {
	box-shadow: none;
	will-change: height;
	transition: height 0s;
}
/* Activity Feed Sort */
.feed-select .el-dropdown,
.section-header .el-dropdown {
	margin-right: 10px;
}
.feed-select .el-dropdown .feed-filter,
.section-header .el-dropdown .feed-filter,
.feed-select .el-dropdown .el-dropdown-link,
.section-header .el-dropdown .el-dropdown-link {
	display: none;
}
.feed-select .el-dropdown .el-dropdown-menu,
.section-header .el-dropdown .el-dropdown-menu {
	display: flex !important;
	position: relative;
	text-align: center;
	margin: 0;
	padding: 0;
	box-shadow: none;
	background-color: rgb(var(--color-foreground));
	border-radius: 3px;
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item {
	line-height: inherit;
	font-size: 1.2rem;
	font-weight: 400;
	white-space: nowrap;
	flex-grow: 1;
	margin: 0;
	padding: 6px 10px;
	color: rgb(var(--color-text-lighter));
	border-radius: 3px;
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:hover,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:hover {
	background-color: inherit;
	color: rgb(var(--color-blue));
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item.active,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item.active,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus {
	font-weight: 500;
	background-color: rgb(var(--color-foreground-blue));
	color: rgb(var(--color-text));
	border-radius: 0;
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item.active:hover,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item.active:hover,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:hover,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:hover,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:hover,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:hover {
	background-color: rgb(var(--color-foreground-blue));
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:first-of-type,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:first-of-type,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:first-of-type.active,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:first-of-type.active,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:first-of-type,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:first-of-type {
	border-radius: 3px 0 0 3px;
}
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:last-of-type,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:active:last-of-type,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:last-of-type.active,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:last-of-type.active,
.feed-select .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:last-of-type,
.section-header .el-dropdown .el-dropdown-menu .el-dropdown-menu__item:focus:last-of-type {
	border-radius: 0 3px 3px 0;
}
.overview .section-header {
	align-items: center;
	display: flex;
}
.overview .section-header .el-dropdown {
	margin-right: 0px;
	margin-left: auto;
	padding-right: 0;
}
/* Announcement */
.announcement {
	background-color: rgb(var(--color-blue-800)) !important;
}
/* Date Picker */
.el-picker-panel {
	border: 1px solid rgb(var(--color-foreground));
	background-color: rgb(var(--color-foreground-grey-dark));
	color: rgb(var(--color-text-bright));
}
.el-picker-panel .el-date-picker__header-label {
	color: rgb(var(--color-text));
}
.el-picker-panel .el-picker-panel__icon-btn,
.el-picker-panel .el-date-table th {
	color: rgb(var(--color-text-light));
}
.el-picker-panel .el-date-table td.current:not(.disabled) span {
	background-color: rgb(var(--color-blue-700));
}
.el-picker-panel .el-date-table th {
	border-bottom: 1px solid #60656c;
	padding: 1px;
}
.el-picker-panel .el-date-table td.next-month,
.el-picker-panel .el-date-table td.prev-month {
	color: #76777a;
}
.el-picker-panel .el-date-table tbody tr:nth-of-type(2) td {
	padding-top: 10px;
}
.el-picker-panel .popper__arrow::after {
	border-bottom-color: rgb(var(--color-foreground-grey-dark)) !important;
	border-top-color: rgb(var(--color-foreground-grey-dark)) !important;
}
/* hoh styling */
#hohSettings .hohCategories {
	display: flex;
	flex-wrap: wrap;
	position: relative;
	text-align: center;
	margin: 0;
	padding: 0;
	box-shadow: none;
	background-color: rgb(var(--color-background));
	border-radius: 3px;
}
#hohSettings .hohCategories .hohCategory {
	border: none;
	line-height: inherit;
	font-size: 1.2rem;
	font-weight: 400;
	white-space: nowrap;
	flex-grow: 1;
	margin: 0;
	padding: 6px 10px;
	color: rgb(var(--color-text-lighter));
	border-radius: 3px;
}
#hohSettings .hohCategories .hohCategory:hover {
	background-color: inherit;
	color: rgb(var(--color-blue));
}
#hohSettings .hohCategories .hohCategory.active,
#hohSettings .hohCategories .hohCategory:active,
#hohSettings .hohCategories .hohCategory:focus {
	font-weight: 500;
	background-color: rgb(var(--color-foreground-blue));
	color: rgb(var(--color-text));
	border-radius: 0;
}
#hohSettings .hohCategories .hohCategory.active:hover,
#hohSettings .hohCategories .hohCategory:active:hover,
#hohSettings .hohCategories .hohCategory:focus:hover {
	background-color: rgb(var(--color-foreground-blue));
}
#hohSettings .hohCategories .hohCategory:active:first-of-type,
#hohSettings .hohCategories .hohCategory:first-of-type.active,
#hohSettings .hohCategories .hohCategory:focus:first-of-type {
	border-radius: 3px 0 0 3px;
}
#hohSettings .hohCategories .hohCategory:active:last-of-type,
#hohSettings .hohCategories .hohCategory:last-of-type.active,
#hohSettings .hohCategories .hohCategory:focus:last-of-type {
	border-radius: 0 3px 3px 0;
}
#hohSettings .hohDisplayBox {
	border-color: #0e1216;
	border-radius: 5px;
}
#hohSettings .scrollableContent {
	padding: 30px;
	padding-top: 35px;
	padding-left: 15px;
}
#hohSettings .hohDisplayBoxTitle {
	top: 25px;
	left: 35px;
	font-weight: bold;
	font-size: 1.7em;
}
#hohSettings .hohResizePearl {
	right: 10px;
	bottom: 10px;
}
#hohSettings .hohDisplayBoxClose {
	padding: 4px;
	border-radius: 20px;
	border-width: 2px;
	border-color: #900;
	width: 30px;
	height: 30px;
	text-align: center;
	vertical-align: bottom;
	font-weight: bold;
}
#hohSettings input,
#hohSettings select {
	height: 40px;
	border-radius: 4px;
	color: rgb(var(--color-text));
	outline: 0;
	transition: 0.2s;
	border: 0;
	background: rgb(var(--color-background));
	box-shadow: none;
	padding-right: 10px;
	padding-left: 15px;
}
#hohSettings textarea {
	border-radius: 4px;
	color: rgb(var(--color-text));
	outline: 0;
	transition: 0.2s;
	border: 0;
	background: rgb(var(--color-background));
	box-shadow: none;
	padding: 10px;
	width: 100%;
	height: 200px;
}
.hohNativeInput {
	height: 40px;
	border-radius: 4px;
	color: rgb(var(--color-text));
	outline: 0;
	transition: 0.2s;
	border: 0;
	background: rgb(var(--color-background));
	box-shadow: none;
	padding-right: 10px;
	padding-left: 15px;
}
.info.hasMeter {
	position: absolute !important;
	width: 100%;
	left: 0 !important;
	bottom: 0 !important;
	padding: 12px;
}
.info.hasMeter meter {
	border-radius: 4px;
	width: 100%;
	height: 5px;
}
.info.hasMeter meter::-moz-meter-bar {
	border-radius: 4px;
}
.activity-entry {
	border-radius: 4px;
	margin-right: 0 !important;
}
/* Forum */
.comment-wrap {
	border-left: 7px solid rgba(var(--color-foreground-blue));
}
.comment-wrap .child.odd {
	border-left: 7px solid rgba(var(--color-foreground-grey-dark));
}
/* Staff/character page header */
@media screen and (max-width: 700px) {
	.character-wrap > .character > .header .mobile-background,
	.staff-wrap > .staff > .header .mobile-background {
		background: rgb(var(--color-foreground));
	}
}
@media screen and (min-width: 701px) {
	.character-wrap > .character > .header,
	.staff-wrap > .staff > .header {
		background: rgb(var(--color-foreground));
	}
}
.character-wrap > .character > .header .name,
.staff-wrap > .staff > .header .name {
	color: rgb(var(--color-gray-900));
}
.character-wrap > .character > .header .name-alt,
.staff-wrap > .staff > .header .name-alt {
	color: rgb(var(--color-gray-800));
}
.character-wrap > .character > .header .edit,
.staff-wrap > .staff > .header .edit {
	color: rgb(var(--color-gray-800));
}
/* ------ Database Tools ------ */
@media screen and (max-width: 800px) {
	.media.container {
		grid-template-columns: auto;
		gap: 20px;
		min-width: 250px;
	}
	/* Popup modal */
	.media.container .el-dialog__wrapper.dialog .el-dialog {
		width: 98%;
	}
	/* Navigation tabs */
	.media.container .pages {
		grid-column: 1;
		grid-row: 1;
	}
	.media.container > div:last-of-type {
		grid-column: 1;
		grid-row: 2;
	}
}
/* General form inputs */
.media.container .submission-form .col-2 {
	gap: 0 10px;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.media.container .submission-form .col-3 {
	gap: 0 10px;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.media.container .submission-form.select-group .col-3 {
	gap: 10px;
	grid-template-columns: repeat(auto-fit, minmax(180px, 250px));
}
/* Character page */
.media.container .character-row {
	grid-template-columns: 1fr 1.3fr 0.1fr;
}
@media screen and (min-width: 1000px) {
	.media.container .character-row {
		grid-template-columns: 0.6fr 1.3fr 0.1fr;
	}
}
@media screen and (max-width: 450px) {
	.media.container .character-row {
		grid-template-columns: auto auto 40px;
		grid-template-rows: auto;
		gap: 10px;
	}
	.media.container .character-row .character.col {
		grid-row: 1;
	}
	.media.container .character-row .actor.col {
		grid-row: 2;
	}
	.media.container .character-row .actions {
		grid-column: 3;
		grid-row: 1 / span 2;
	}
}
/* Images */
@media screen and (min-width: 550px) {
	.media.container .images .submission-form:first-of-type {
		display: grid;
		grid-template-columns: min-content;
	}
	.media.container .images .submission-form:first-of-type .el-input {
		grid-column: 2;
		grid-row: 1;
	}
	.media.container .images .submission-form:first-of-type .cover {
		margin-right: 15px;
		grid-column: 1;
		grid-row: 1;
	}
}
.media.container .images .submission-form .cover.banner {
	width: 100%;
}
/* Increased active tab contrast in media and user nav */
.media .nav .link.router-link-exact-active.router-link-active,
.user .nav .link.router-link-exact-active.router-link-active {
	background: rgba(var(--color-background-200));
}
.media .nav .link.router-link-exact-active.router-link-active {
	color: rgb(var(--color-blue));
	border-radius: 3px 3px 0 0;
	padding: 15px 30px;
}
/* Reduce transparancy of card view notes to make them less easier to miss (accessibility) */
.medialist.cards .entry-card .notes,
.medialist.cards .entry-card .repeat {
	color: rgba(var(--color-white),1) !important;
	filter: drop-shadow(0 0 3px rgba(0,0,0,.9)) !important;
}
/* Increased contrast of review date */
.review .banner .date {
	color: rgba(var(--color-white),.6);
}
`
	if(useScripts.reinaDarkEnable){
		darkContrastStyle.textContent = style
	}
	let adder = function(){//listen for the Site Theme changer to appear. A poller should be all that's needed
		let siteThemeSwitch = document.querySelector(".footer .theme-selector");
		if(!siteThemeSwitch){
			setTimeout(adder,500);//pretty relaxed timer, since the footer isn't even on screen when the page loads. 
		}
		else{
			siteThemeSwitch.appendChild(document.createTextNode(" "));
			Array.from(document.querySelectorAll(".el-tooltip.theme-preview")).forEach(theme => {
				theme.onclick = function(){
					if(useScripts.reinaDarkEnable){
						useScripts.reinaDarkEnable = false;
						useScripts.save();
						darkContrastStyle.textContent = ""
					}
				}
			})
			let darkContrastSwitch = create("div",["el-tooltip","theme-preview","dark-contrast"],"A",siteThemeSwitch);
			darkContrastSwitch.title = translate("$theme_highContrastDark");//not quite the same as the native tooltip, but that's a minor issue that can be fixed later
			darkContrastSwitch.onclick = function(){
				if(!useScripts.reinaDarkEnable){
					document.querySelector(".el-tooltip.theme-preview.dark").click();//fallback theme
					useScripts.reinaDarkEnable = true;
					useScripts.save();
					darkContrastStyle.textContent = style
				}
			}
		}
	};
	adder()
}
//end modules/reinaDark.js
//begin modules/relations.js
exportModule({
	id: "relations",
	description: "$relations_description",
	isDefault: true,
	categories: ["Profiles"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return /^https:\/\/anilist\.co\/user\/(.*)\/social/.test(url)
	},
	code: function(){
		let their_followers = null;
		let their_following = null;
		let my_followers = null;
		let my_following = null;
		let userID = null;
		let user = decodeURIComponent(document.URL.match(/^https:\/\/anilist\.co\/user\/(.*)\/social/)[1]);
		generalAPIcall(
			"query($name:String){User(name:$name){id}}",
			{name: user},
			function(data){
				userID = data.data.User.id
			},
			"hohIDlookup" + user.toLowerCase()
		);
		
		let adder = function(){
			let matching = location.pathname.match(/^\/user\/(.*)\/social/);
			if(!matching){
				return;
			}
			let target = document.querySelector(".filters .filter-group");
			if(!target){
				setTimeout(adder,500);
				return
			}
			let hohDisplay = create("div",["hohSocialContent","user-follow"],false,target.parentNode.parentNode);
			Array.from(target.children).forEach(child => {
				child.onclick = function(){
					let possibleActive = target.querySelector(".active");
					if(possibleActive){
						possibleActive.classList.remove("active");
					}
					possibleActive = target.querySelector(".active");
					if(possibleActive){
						possibleActive.classList.remove("active");
					}
					child.classList.add("active");
					target.parentNode.parentNode.children[1].style.display = "block";
					hohDisplay.style.display = "none";
				}
			})
			let followingOnly = create("span",false,translate("$relations_following_only"),target);
			let followingOnly_count = create("span","hohCount",false,followingOnly);
			let followersOnly = create("span",false,translate("$relations_followers_only"),target);
			let followersOnly_count = create("span","hohCount",false,followersOnly);
			let mutuals = create("span",false,translate("$relations_mutuals"),target);
			let mutuals_count = create("span","hohCount",false,mutuals);
			let sharedFollowing = create("span",false,translate("$relations_shared_following"),target);
			let sharedFollowing_count = create("span","hohCount",false,sharedFollowing);
			let sharedFollowers = create("span",false,translate("$relations_shared_followers"),target);
			let sharedFollowers_count = create("span","hohCount",false,sharedFollowers);
			if(user === whoAmI){
				sharedFollowing.style.display = "none";
				sharedFollowers.style.display = "none";
			}
			let commonUI = function(){
				let possibleActive = target.querySelector(".active");
				if(possibleActive){
					possibleActive.classList.remove("active");
				}
				possibleActive = target.querySelector(".active");
				if(possibleActive){
					possibleActive.classList.remove("active");
				}
				target.parentNode.parentNode.children[1].style.display = "none";
				hohDisplay.style.display = ""
			}

			let activeModule = "";

			let followingOnlyDisplay = function(){
				hohDisplay.innerText = "";
				let count = 0;
				their_following.forEach((user,key) => {
					if(!their_followers.has(key)){
						count++;
						if(activeModule === "followingOnly"){
							let card = create("div","follow-card",false,hohDisplay);
							let avatar = create("div","avatar",false,card);
							avatar.style.backgroundImage = 'url("' + user.avatar.large + '")';
							let name = create("a","name",user.name,avatar);
							name.href = "/user/" + user.name;
						}
					}
				})
				followingOnly_count.innerText = count
			}

			let followersOnlyDisplay = function(){
				hohDisplay.innerText = "";
				let count = 0;
				their_followers.forEach((user,key) => {
					if(!their_following.has(key)){
						count++;
						if(activeModule === "followersOnly"){
							let card = create("div","follow-card",false,hohDisplay);
							let avatar = create("div","avatar",false,card);
							avatar.style.backgroundImage = 'url("' + user.avatar.large + '")';
							let name = create("a","name",user.name,avatar);
							name.href = "/user/" + user.name;
						}
					}
				})
				followersOnly_count.innerText = count
			}

			let mutualDisplay = function(){
				hohDisplay.innerText = "";
				let count = 0;
				their_followers.forEach((user,key) => {
					if(their_following.has(key)){
						count++;
						if(activeModule === "mutuals"){
							let card = create("div","follow-card",false,hohDisplay);
							let avatar = create("div","avatar",false,card);
							avatar.style.backgroundImage = 'url("' + user.avatar.large + '")';
							let name = create("a","name",user.name,avatar);
							name.href = "/user/" + user.name;
						}
					}
				})
				mutuals_count.innerText = count
			}

			let sharedFollowingDisplay = function(){
				hohDisplay.innerText = "";
				let count = 0;
				their_following.forEach((user,key) => {
					if(my_following.has(key)){
						count++;
						if(activeModule === "sharedFollowing"){
							let card = create("div","follow-card",false,hohDisplay);
							let avatar = create("div","avatar",false,card);
							avatar.style.backgroundImage = 'url("' + user.avatar.large + '")';
							let name = create("a","name",user.name,avatar);
							name.href = "/user/" + user.name;
						}
					}
				})
				sharedFollowing_count.innerText = count
			}

			let sharedFollowersDisplay = function(){
				hohDisplay.innerText = "";
				let count = 0;
				their_followers.forEach((user,key) => {
					if(my_followers.has(key)){
						count++;
						if(activeModule === "sharedFollowers"){
							let card = create("div","follow-card",false,hohDisplay);
							let avatar = create("div","avatar",false,card);
							avatar.style.backgroundImage = 'url("' + user.avatar.large + '")';
							let name = create("a","name",user.name,avatar);
							name.href = "/user/" + user.name;
						}
					}
				})
				sharedFollowers_count.innerText = count
			}

			let collect_theirFollowing = function(page1,page2,id,displayer){
				generalAPIcall(
`query{
	page1:Page(page:${page1}){
		following(userId:${id}){
			id name avatar{large}
		}
	}
	page2:Page(page:${page2}){
		following(userId:${id}){
			id name avatar{large}
		}
	}
}`,
					{},
					function(data){
						if(!data){
							return;
						}
						data.data.page1.following.concat(data.data.page2.following).forEach(user => {
							their_following.set(user.id,user)
						})
						displayer();
						if(data.data.page2.following.length){
							collect_theirFollowing(page1 + 2,page2 + 2,id,displayer)
						}
					}
				);
			}
			let collect_theirFollowers = function(page1,page2,id,displayer){
				generalAPIcall(
`query{
	page1:Page(page:${page1}){
		followers(userId:${id}){
			id name avatar{large}
		}
	}
	page2:Page(page:${page2}){
		followers(userId:${id}){
			id name avatar{large}
		}
	}
}`,
					{},
					function(data){
						if(!data){
							return;
						}
						data.data.page1.followers.concat(data.data.page2.followers).forEach(user => {
							their_followers.set(user.id,user)
						})
						displayer();
						if(data.data.page2.followers.length){
							collect_theirFollowers(page1 + 2,page2 + 2,id,displayer)
						}
					}
				);
			}

			let collect_myFollowing = function(page1,page2,id,displayer){
				generalAPIcall(
`query{
	page1:Page(page:${page1}){
		following(userId:${id}){
			id name avatar{large}
		}
	}
	page2:Page(page:${page2}){
		following(userId:${id}){
			id name avatar{large}
		}
	}
}`,
					{},
					function(data){
						if(!data){
							return;
						}
						data.data.page1.following.concat(data.data.page2.following).forEach(user => {
							my_following.set(user.id,user)
						})
						displayer();
						if(data.data.page2.following.length){
							collect_myFollowing(page1 + 2,page2 + 2,id,displayer)
						}
					}
				);
			}
			let collect_myFollowers = function(page1,page2,id,displayer){
				generalAPIcall(
`query{
	page1:Page(page:${page1}){
		followers(userId:${id}){
			id name avatar{large}
		}
	}
	page2:Page(page:${page2}){
		followers(userId:${id}){
			id name avatar{large}
		}
	}
}`,
					{},
					function(data){
						if(!data){
							return;
						}
						data.data.page1.followers.concat(data.data.page2.followers).forEach(user => {
							my_followers.set(user.id,user)
						})
						displayer();
						if(data.data.page2.followers.length){
							collect_myFollowers(page1 + 2,page2 + 2,id,displayer)
						}
					}
				);
			}

			followingOnly.onclick = function(){
				commonUI();
				activeModule = "followingOnly";
				followingOnly.classList.add("active");
				if(their_followers && their_following){
					followingOnlyDisplay()
				}
				else if(their_followers && !their_following){
					their_following = new Map();
					collect_theirFollowing(1,2,userID,followingOnlyDisplay);
				}
				else if(!their_followers && their_following){
					their_followers = new Map();
					collect_theirFollowers(1,2,userID,followingOnlyDisplay);
				}
				else{
					their_following = new Map();
					their_followers = new Map();
					collect_theirFollowing(1,2,userID,followingOnlyDisplay);
					collect_theirFollowers(1,2,userID,followingOnlyDisplay);
				}
			}
			followersOnly.onclick = function(){
				commonUI();
				activeModule = "followersOnly";
				followersOnly.classList.add("active");
				if(their_followers && their_following){
					followersOnlyDisplay()
				}
				else if(their_followers && !their_following){
					their_following = new Map();
					collect_theirFollowing(1,2,userID,followersOnlyDisplay);
				}
				else if(!their_followers && their_following){
					their_followers = new Map();
					collect_theirFollowers(1,2,userID,followersOnlyDisplay);
				}
				else{
					their_following = new Map();
					their_followers = new Map();
					collect_theirFollowing(1,2,userID,followersOnlyDisplay);
					collect_theirFollowers(1,2,userID,followersOnlyDisplay);
				}
			}
			mutuals.onclick = function(){
				commonUI();
				activeModule = "mutuals";
				mutuals.classList.add("active");
				if(their_followers && their_following){
					mutualDisplay()
				}
				else if(their_followers && !their_following){
					their_following = new Map();
					collect_theirFollowing(1,2,userID,mutualDisplay);
				}
				else if(!their_followers && their_following){
					their_followers = new Map();
					collect_theirFollowers(1,2,userID,mutualDisplay);
				}
				else{
					their_following = new Map();
					their_followers = new Map();
					collect_theirFollowing(1,2,userID,mutualDisplay);
					collect_theirFollowers(1,2,userID,mutualDisplay);
				}
			}
			sharedFollowing.onclick = function(){
				commonUI();
				activeModule = "sharedFollowing";
				sharedFollowing.classList.add("active");
				if(their_following && my_following){
					sharedFollowingDisplay()
				}
				else if(their_following && !my_following){
					my_following = new Map();
					collect_myFollowing(1,2,userObject.id,sharedFollowingDisplay);
				}
				else if(!their_following && my_following){
					their_following = new Map();
					collect_theirFollowing(1,2,userID,sharedFollowingDisplay);
				}
				else{
					my_following = new Map();
					their_following = new Map();
					collect_myFollowing(1,2,userObject.id,sharedFollowingDisplay);
					collect_theirFollowing(1,2,userID,sharedFollowingDisplay);
				}
			}
			sharedFollowers.onclick = function(){
				commonUI();
				activeModule = "sharedFollowers";
				sharedFollowers.classList.add("active");
				if(their_followers && my_followers){
					sharedFollowersDisplay()
				}
				else if(their_followers && !my_followers){
					my_followers = new Map();
					collect_myFollowers(1,2,userObject.id,sharedFollowersDisplay);
				}
				else if(!their_followers && my_followers){
					their_followers = new Map();
					collect_theirFollowers(1,2,userID,sharedFollowersDisplay);
				}
				else{
					my_followers = new Map();
					their_followers = new Map();
					collect_myFollowers(1,2,userObject.id,sharedFollowersDisplay);
					collect_theirFollowers(1,2,userID,sharedFollowersDisplay);
				}
			}
		};adder()
	},
	css: `
.user-social .filter-group span{
	cursor: pointer;
	border-radius: 3px;
	color: rgb(var(--color-text-lighter));
	display: block;
	font-size: 1.4rem;
	margin-bottom: 8px;
	padding: 5px 10px;
}
.user-social .filter-group span.active{
	background: rgba(var(--color-foreground),.8);
	color: rgb(var(--color-text));
	font-weight: 500;
}
.hohSocialContent .follow-card{
	width: 80px;
	position: relative;
}
.hohSocialContent .avatar{
	width: 80px;
	height: 80px;
	background-size: cover;
	background-repeat: no-repeat;
	background-position: 50%;
	overflow: hidden;
	border-radius: 4px;
}
.hohSocialContent .avatar .name{
	font-family: Overpass,-apple-system,BlinkMacSystemFont,Segoe UI,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;
	align-items: flex-end;
	background: rgba(var(--color-shadow),.6);
	color: rgb(var(--color-white));
	display: flex;
	font-size: 1.3rem;
	font-weight: 700;
	height: 100%;
	justify-content: center;
	opacity: 0;
	padding: 10px 4px;
	text-align: center;
	transition: opacity .3s ease-in-out;
	width: 100%;
	word-break: break-all;
}
.hohSocialContent .avatar .name:hover{
	opacity: 1;
	color: rgb(var(--color-white));
}
.hohSocialContent{
	display: grid;
	grid-gap: 20px;
	grid-template-columns: repeat(auto-fill,80px);
	grid-template-rows: repeat(auto-fill,80px);
}
`
})
//end modules/relations.js
//begin modules/replaceStaffRoles.js
exportModule({
	id: "replaceStaffRoles",
	description: "$replaceStaffRoles_description",
	isDefault: !!useScripts.accessToken,
	categories: ["Media","Login"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/staff\/.*/)
	},
	code: function(){
let selfcaller = function(){
let URLstuff = location.pathname.match(/^\/staff\/(\d+)\/?.*/);
if(!URLstuff){
	return
}
let possibleGarbage = document.getElementById("hoh-media-roles");
if(possibleGarbage){
	if(possibleGarbage.dataset.staffId === URLstuff[1]){
		return
	}
	else{
		possibleGarbage.remove();
		let possibleFilterBar = document.querySelector(".hohFilterBar");
		if(possibleFilterBar){
			possibleFilterBar.remove()
		}
	}
}
let insertParent = document.querySelector(".media-roles");
let insertParentCharacters = document.querySelector(".character-roles");
if(!insertParent && !insertParentCharacters){
	setTimeout(selfcaller	,200);
	return;
}
insertParentCharacters.classList.add("hohSubstitute");
let substitution = false;
if(!insertParent){
	insertParent = create("div",["media-roles","container","substitution"],false,insertParentCharacters.parentNode);
	substitution = true
}
else{
	insertParent.classList.add("substitution")
}
insertParent.parentNode.classList.add("substitution");
let hohCharacterRolesBox = create("div","#hoh-character-roles");
let hohCharacterRolesHeader = create("h4",false,translate("$staff_voiceRoles"),hohCharacterRolesBox);
hohCharacterRolesHeader.style.display = "none";
let hohCharacterRoles = create("div","grid-wrap",false,hohCharacterRolesBox);
hohCharacterRoles.style.margin = "10px";

let hohMediaRoles = create("div","#hoh-media-roles");
hohMediaRoles.dataset.staffId = URLstuff[1];
let hohMediaRolesAnimeHeader = create("h4",false,translate("$staff_animeRoles"),hohMediaRoles);
hohMediaRolesAnimeHeader.style.display = "none";
let hohMediaRolesAnime = create("div","grid-wrap",false,hohMediaRoles);
hohMediaRolesAnime.style.margin = "10px";

let hohMediaRolesMangaHeader = create("h4",false,translate("$staff_mangaRoles"),hohMediaRoles);
hohMediaRolesMangaHeader.style.display = "none";
let hohMediaRolesManga = create("div","grid-wrap",false,hohMediaRoles);
hohMediaRolesManga.style.margin = "10px";
//sort
let hohMediaSort = create("div",["container","hohFilterBar"]);
let sortText = create("span",false,translate("$staff_sort"),hohMediaSort);
let sortSelect = create("select",false,false,hohMediaSort);
sortSelect.style.marginLeft = "5px";
let filterSelect = create("input",false,false,hohMediaSort);
filterSelect.setAttribute("list","staffRoles");
filterSelect.placeholder = translate("$staff_filter_placeholder");
let filterExplanation = create("abbr",false,"?",hohMediaSort,"margin-left:5px;cursor:pointer;");
filterExplanation.title = translate("$staff_filterHelp");
filterExplanation.onclick = function(){
	let scrollableContent = createDisplayBox("min-width:400px;width:700px;");
	scrollableContent.innerText = `
Text in the field will be matched against all titles, roles, genres, tags, your status, the media format and the start year. If it matches one of them, the media is displayed.

Regular expressions are permitted for titles.

If you want to limit it to just one filter type, you can do it like "genre:mecha" or "status:watching"
(status filtering only works if you have granted ${script_type} permission to view your list data)

The start year can also be a range like "2000-2005"`
};
let dataList = create("datalist","#staffRoles",false,hohMediaSort);
let digestStats = create("span",false,false,hohMediaSort,"margin-left:100px;position:relative;");
let sortOptionAlpha = create("option",false,translate("$sort_alphabetical"),sortSelect);
sortOptionAlpha.value = "alphabetical";
let sortOptionChrono2 = create("option",false,translate("$sort_newest"),sortSelect);
sortOptionChrono2.value = "chronological2";
let sortOptionChrono = create("option",false,translate("$sort_oldest"),sortSelect);
sortOptionChrono.value = "chronological";
let sortOptionPopularity = create("option",false,translate("$sort_popularity"),sortSelect);
sortOptionPopularity.value = "popularity";
let sortOptionLength = create("option",false,translate("$sort_length"),sortSelect);
sortOptionLength.value = "length";
let sortOptionScore = create("option",false,translate("$sort_score"),sortSelect);
sortOptionScore.value = "score";
if(useScripts.accessToken){
	create("option",false,translate("$sort_myScore"),sortSelect)
		.value = "myScore"
	create("option",false,translate("$sort_myProgress"),sortSelect)
		.value = "myProgress"
}
let autocomplete = new Set();
sortSelect.value = useScripts.staffRoleOrder;
hohMediaSort.style.marginBottom = "10px";
hohMediaSort.style.marginTop = "3px";
//end sort
let initPerformed = false;
let UIinit = function(){
	initPerformed = true;
	insertParent.parentNode.insertBefore(hohMediaSort,insertParentCharacters);
	insertParent.insertBefore(hohMediaRoles,insertParent.children[0]);
	insertParentCharacters.insertBefore(hohCharacterRolesBox,insertParentCharacters.children[0]);
	if(document.querySelector(".filters.container")){
		document.querySelector(".filters.container").remove()
	}
};
let animeRolesList = [];
let mangaRolesList = [];
let voiceRolesList = [];
const animeValueFunction = function(anime){
	if(!anime.myStatus){
		return -1
	}
	let entryDuration = (anime.duration || 1)*(anime.myStatus.progress || 0);//current round
	if(useScripts.noRewatches && anime.myStatus.repeat){
		entryDuration = Math.max(
			1,
			anime.episodes || 0,
			anime.myStatus.progress || 0
		) * (anime.duration || 1);//first round
	}
	else{
		entryDuration += (anime.myStatus.repeat || 0) * Math.max(
			1,
			anime.episodes || 0,
			anime.myStatus.progress || 0
		) * (anime.duration || 1);//repeats
	}
	if(anime.listJSON && anime.listJSON.adjustValue){
		entryDuration = Math.max(0,entryDuration + anime.listJSON.adjustValue*(anime.duration || 1))
	}
	return entryDuration
}
const mangaValueFunction = function(manga){
	if(!manga.myStatus){
		return {
			chapters: 0,
			volumes: 0
		}
	}
	let chaptersRead = 0;
	let volumesRead = 0;
	if(manga.myStatus.status === "COMPLETED"){//if it's completed, we can make some safe assumptions
		chaptersRead = Math.max(//chapter progress on the current read
			manga.chapters,//in most cases, it has a chapter count
			manga.volumes,//if not, there's at least 1 chapter per volume
			manga.myStatus.progress,//if it doesn't have a volume count either, the current progress is probably not out of date
			manga.myStatus.progressVolumes,//if it doesn't have a chapter progress, count at least 1 chapter per volume
			1//finally, an entry has at least 1 chapter
		);
		volumesRead += Math.max(
			manga.myStatus.progressVolumes,
			manga.volumes
		)
	}
	else{//we may only assume what's on the user's list.
		chaptersRead += Math.max(
			manga.myStatus.progress,
			manga.myStatus.progressVolumes
		);
		volumesRead += manga.myStatus.progressVolumes;
	}
	if(useScripts.noRewatches && (manga.myStatus.repeat || 0)){//if they have a reread, they have at least completed it
		chaptersRead = Math.max(//first round
			manga.chapters,
			manga.volumes,
			manga.myStatus.progress,
			manga.myStatus.progressVolumes,
			1
		);
		volumesRead = Math.max(
			manga.volumes,
			manga.myStatus.progressVolumes
		)
	}
	else{
		chaptersRead += (manga.myStatus.repeat || 0) * Math.max(//chapters from rereads
			manga.chapters,
			manga.volumes,
			manga.myStatus.progress,
			manga.myStatus.progressVolumes,
			1
		);
		volumesRead += (manga.myStatus.repeat || 0) * Math.max(
			manga.volumes,
			manga.myStatus.progressVolumes
		)
	}
	if(manga.listJSON && manga.listJSON.adjustValue){
		chaptersRead = Math.max(0,chaptersRead + manga.listJSON.adjustValue)
	}
	return {
		chapters: chaptersRead,
		volumes: volumesRead
	}
}
let listRenderer = function(){
	if(!initPerformed){
		UIinit()
	}
	useScripts.staffRoleOrder = sortSelect.value;
	useScripts.save();
	if(sortSelect.value === "alphabetical"){
		animeRolesList.sort(ALPHABETICAL(a => a.title));
		mangaRolesList.sort(ALPHABETICAL(a => a.title));
		voiceRolesList.sort(ALPHABETICAL(a => a.title))
	}
	else if(sortSelect.value === "chronological"){
		const yearSorter = (a,b) => {
			let aTime = a.startDate;
			let bTime = b.startDate;
			if(!aTime.year){
				aTime = a.endDate
			}
			if(!bTime.year){
				bTime = b.endDate
			}
			if(!aTime.year){
				if(!bTime.year){
					if(b.status === "NOT_YET_RELEASED" && a.status === "NOT_YET_RELEASED"){
						return 0
					}
					else if(a.status === "NOT_YET_RELEASED"){
						return -1
					}
				}
				return 1;
			}
			else if(!bTime.year){
				return -1
			}
			return aTime.year - bTime.year
				|| aTime.month - bTime.month
				|| aTime.day - bTime.day
				|| a.endDate.year - b.endDate.year
				|| a.endDate.month - b.endDate.month
				|| a.endDate.day - b.endDate.day
				|| 0
		};
		animeRolesList.sort(yearSorter);
		mangaRolesList.sort(yearSorter);
		voiceRolesList.sort(yearSorter)
	}
	else if(sortSelect.value === "chronological2"){
		const yearSorter = (a,b) => {
			let aTime = a.startDate;
			let bTime = b.startDate;
			if(!aTime.year){
				aTime = a.endDate
			}
			if(!bTime.year){
				bTime = b.endDate
			}
			if(!aTime.year){
				if(!bTime.year){
					if(b.status === "NOT_YET_RELEASED" && a.status === "NOT_YET_RELEASED"){
						return 0
					}
					else if(a.status === "NOT_YET_RELEASED"){
						return -1
					}
				}
				return 1;
			}
			else if(!bTime.year){
				return -1
			}
			return bTime.year - aTime.year
				|| bTime.month - aTime.month
				|| bTime.day - aTime.day
				|| b.endDate.year - a.endDate.year
				|| b.endDate.month - a.endDate.month
				|| b.endDate.day - a.endDate.day
				|| 0
		};
		animeRolesList.sort(yearSorter);
		mangaRolesList.sort(yearSorter);
		voiceRolesList.sort(yearSorter)
	}
	else if(sortSelect.value === "popularity"){
		const popSorter = (b,a) => a.popularity - b.popularity || a.score - b.score;
		animeRolesList.sort(popSorter);
		mangaRolesList.sort(popSorter);
		voiceRolesList.sort(popSorter)
	}
	else if(sortSelect.value === "score"){
		const scoreSorter = (b,a) => a.score - b.score || a.popularity - b.popularity;
		animeRolesList.sort(scoreSorter);
		mangaRolesList.sort(scoreSorter);
		voiceRolesList.sort(scoreSorter)
	}
	else if(sortSelect.value === "length"){
		animeRolesList.sort(
			(b,a) => a.episodes - b.episodes || a.duration - b.duration || b.title.localeCompare(a.title)
		);
		voiceRolesList.sort(
			(b,a) => a.episodes - b.episodes || a.duration - b.duration || b.title.localeCompare(a.title)
		);
		mangaRolesList.sort(
			(b,a) => a.chapters - b.chapters || a.volumes - b.volumes || b.title.localeCompare(a.title)
		)
	}
	else if(sortSelect.value === "myScore"){
		let scoreSorter = function(b,a){
			let scoreTier = (a.myStatus ? a.myStatus.scoreRaw : 0) - (b.myStatus ? b.myStatus.scoreRaw : 0);
			if(scoreTier !== 0){
				return scoreTier
			}
			let progressTier = (a.myStatus ? a.myStatus.progress : -1) - (b.myStatus ? b.myStatus.progress : -1);
			if(progressTier !== 0){
				return progressTier
			}
			return a.popularity - b.popularity
		}
		animeRolesList.sort(scoreSorter);
		mangaRolesList.sort(scoreSorter);
		voiceRolesList.sort(scoreSorter);
	}
	else if(sortSelect.value === "myProgress"){
		const animeSorter = (b,a) => animeValueFunction(a) - animeValueFunction(b) || b.title.localeCompare(a.title);
		const mangaSorter = (b,a) => {
			const aval = mangaValueFunction(a);
			const bval = mangaValueFunction(b);
			return aval.chapters - bval.chapters || aval.volumes - bval.volumes || b.title.localeCompare(a.title)
		}
		animeRolesList.sort(animeSorter);
		voiceRolesList.sort(animeSorter);
		mangaRolesList.sort(mangaSorter);
	}
	hohMediaRolesAnimeHeader.style.display = "none";
	hohMediaRolesMangaHeader.style.display = "none";
	hohCharacterRolesHeader.style.display = "none";
	if(animeRolesList.length){
		hohMediaRolesAnimeHeader.style.display = "inline-block";
		hohMediaRolesAnimeHeader.style.marginBottom = 0;
	}
	if(mangaRolesList.length){
		hohMediaRolesMangaHeader.style.display = "inline-block";
		hohMediaRolesMangaHeader.style.marginBottom = 0;
	}
	if(voiceRolesList.length){
		hohCharacterRolesHeader.style.display = "inline-block";
		hohCharacterRolesHeader.style.marginBottom = 0;
	}
	let createRoleCard = function(media,type){
		let roleCard = create("div",["role-card","view-media"]);
		roleCard.style.position = "relative";
		let mediaA = create("div","media",false,roleCard);
		let cover = create("a","cover",false,mediaA);
		cover.href = "/" + type + "/" + media.id + "/" + safeURL(media.title);
		cheapReload(cover,{path: cover.pathname})
		cover.style.backgroundImage = "url(" + media.image + ")";
		let content = create("a","content",false,mediaA);
		content.href = "/" + type + "/" + media.id + "/" + safeURL(media.title);
		cheapReload(content,{path: content.pathname})
		let name = create("div","name",media.title,content);

		//default value of a credit not listed here is 0. Positive values are more important, negative less important
		let roleValues = {
			"Director": 2,
			"Creator": 1.91,
			"Original Creator": 1.9,//important that this is early
			"Script": 1.8,
			"Storyboard": 1.75,
			"Art Director": 1.7,//personal bias :)
			"Character Design": 1.65,
			"Animation Director": 1.6,
			"Sound Director": 1.5,
			"Assistant Director": 1,
			"Episode Director": 1,
			"Main Animator": 0.1,
			"Key Animation": 0,
			"Animation": -0.1,
			"2nd Key Animation": -0.5,
			"In-Between Animation": -1
		}
		media.role.sort((b,a) => {
			let amatch = roleValues[a.match(/^(.*?)(\s*\(.*\))?$/)[1]] || 0;
			let bmatch = roleValues[b.match(/^(.*?)(\s*\(.*\))?$/)[1]] || 0;
			return amatch - bmatch
		})

		let role = create("div","role",media.role.map(word => {
			let parts = word.trim().match(/^(.*?)(\s+\(.*\))?$/);
			let t_role = translate("$role_" + parts[1]);
			if(t_role.substring(0,6) === "$role_"){
				return word
			}
			return t_role + (parts[2] || "")
		}).join(", "),content);
		role.title = media.role.join("\n");
		if(sortSelect.value === "popularity"){
			create("span","hohStaffPageData",media.popularity,content).title = "Popularity"
		}
		else if(sortSelect.value === "score"){
			create("span","hohStaffPageData",media.score || "",content).title = "Score"
		}
		else if(sortSelect.value === "length"){
			create("span","hohStaffPageData",media.episodes || media.chapers || media.volumes || "",content).title = "Length"
		}
		else if(sortSelect.value === "myProgress"){
			let staffPageData = create("span","hohStaffPageData",false,content)
			staffPageData.title = "Progress";
			if(type === "manga"){
				staffPageData.innerText = mangaValueFunction(media).chapters || ""
			}
			else{
				let animeVal = animeValueFunction(media);
				if(animeVal > 0){
					staffPageData.innerText = (animeVal/60).roundPlaces(1) + "h";
				}
			}
		}
		else if(sortSelect.value === "myScore"){
			create("span","hohStaffPageData",(media.myStatus ? media.myStatus.scoreRaw : null) || "",content).title = "My Score"
		}
		if(media.myStatus){
			let statusDot = create("div",["hohStatusDot","hohStatusDotRight"],false,roleCard);
			statusDot.style.background = distributionColours[media.myStatus.status];
			statusDot.title = media.myStatus.status.toLowerCase();
			if(media.myStatus.status === "CURRENT"){
				statusDot.title += " (" + media.myStatus.progress + ")"
			}
		}
		return roleCard;
	};
	let sumDuration = 0;
	let sumChapters = 0;
	let sumVolumes = 0;
	let sumScoresAnime = 0;
	let sumScoresManga = 0;
	let amountAnime = 0;
	let amountManga = 0;
	let animeCurrentFlag = false;
	let mangaCurrentFlag = false;
	let distribution = {};
	let alreadyCounted = new Set();
	Object.keys(distributionColours).forEach(
		status => distribution[status] = 0
	);
	removeChildren(hohCharacterRoles)
	Array.from(insertParentCharacters.children).forEach(child => {
		if(child.id !== "hoh-character-roles"){
			child.style.display = "none";
		}
	})
	Array.from(insertParent.children).forEach(child => {
		if(child.id !== "hoh-media-roles"){
			child.style.display = "none"
		}
	})
	const mediaMatcher = {
		"romaji": (query,media) => media.titleRomaji && (
			media.titleRomaji.toLowerCase().match(query.toLowerCase())
			|| media.titleRomaji.toLowerCase().includes(query.toLowerCase())
		),
		"english": (query,media) => media.titleEnglish && (
			media.titleEnglish.toLowerCase().match(query.toLowerCase())
			|| media.titleEnglish.toLowerCase().includes(query.toLowerCase())
		),
		"native": (query,media) => media.titleNative && (
			media.titleNative.toLowerCase().match(query.toLowerCase())
			|| media.titleNative.toLowerCase().includes(query.toLowerCase())
		),
		"format": (query,media) => (media.format || "").replace("_","").toLowerCase().match(
			query.toLowerCase().replace(/\s|-|_/,"")
		),
		"type": (query,media) => media.type === query.trim().toUpperCase().replace(/\s|-|_/,""),
		"status": (query,media) => media.myStatus && (
			media.myStatus.status.toLowerCase() === query.toLowerCase()
			|| media.myStatus.status === "CURRENT"  && ["reading","watching"].includes(query.toLowerCase())
			|| media.myStatus.status === "PLANNING" && ["plan to watch","plan to read","planning"].includes(query.toLowerCase())
		),
		"year": (query,media) => {
			const rangeMatch = query.trim().match(/^(\d\d\d\d)\s?-\s?(\d\d\d\d)$/);
			return parseInt(query) === (media.startDate.year || media.endDate.year)
				|| rangeMatch && parseInt(rangeMatch[1]) <= media.startDate.year && parseInt(rangeMatch[2]) >= media.startDate.year
				|| rangeMatch && parseInt(rangeMatch[2]) <= media.startDate.year && parseInt(rangeMatch[1]) >= media.startDate.year
		},
		"genre": (query,media) => media.genres.some(
			genre => genre === query.toLowerCase()
		),
		"tag": (query,media) => media.tags.some(
			tag => tag === query.toLowerCase()
		),
		"role": (query,media) => media.role.some(
			role => {
				let parts = role.trim().match(/^(.*?)(\s+\(.*\))?$/);
				let t_role = translate("$role_" + parts[1]);
				if(t_role.substring(0,6) !== "$role_" && t_role.toLowerCase().match(query.toLowerCase())){
					return true
				}
				return role.toLowerCase().match(query.toLowerCase())
			}
		),
		"title": (query,media) => mediaMatcher["romaji"](query,media)
			|| mediaMatcher["english"](query,media)
			|| mediaMatcher["native"](query,media)
	}
	let voiceYear = 0;
	if(sortSelect.value === "chronological2"){
		voiceYear = 3000//Y3k, here we goooo
	}
	voiceRolesList.forEach(anime => {
		let foundRole = filterSelect.value === "";
		if(!foundRole){
			let specificMatch = filterSelect.value.toLowerCase().match(/^\s*(.*?)\s*:\s*(.*)/);
			if(specificMatch && Object.keys(mediaMatcher).includes(specificMatch[1])){
				foundRole = mediaMatcher[specificMatch[1]](specificMatch[2],anime)
			}
			else{
				foundRole = Object.keys(mediaMatcher).some(
					key => mediaMatcher[key](filterSelect.value,anime)
				)
				|| looseMatcher(anime.character.name,filterSelect.value)
			}
		}
		if(foundRole){
			if(sortSelect.value === "chronological"){
				if((anime.startDate.year || anime.endDate.year) > voiceYear){
					voiceYear = anime.startDate.year || anime.endDate.year;
					create("h3","hohYearHeading",voiceYear,hohCharacterRoles)
				}
				else if(!(anime.startDate.year || anime.endDate.year) && voiceYear > 0){
					animeYear = 0;
					create("h3","hohYearHeading","No date",hohCharacterRoles)
				}
			}
			else if(sortSelect.value === "chronological2"){
				if((anime.startDate.year || anime.endDate.year) < voiceYear){
					voiceYear = anime.startDate.year || anime.endDate.year;
					create("h3","hohYearHeading",voiceYear,hohCharacterRoles)
				}
				else if(!(anime.startDate.year || anime.endDate.year) && voiceYear > 0){
					animeYear = 0;
					create("h3","hohYearHeading","No date",hohCharacterRoles)
				}
			}
			let roleCard = createRoleCard(anime,"anime");
			roleCard.classList.add("view-media-character");
			roleCard.classList.remove("view-media");
			let character = create("div","character",false,false,"grid-area: character;grid-template-columns: auto 60px;grid-template-areas: 'content image'");
			let cover = create("a","cover",false,character);
			cover.href = "/character/" + anime.character.id + "/" + safeURL(anime.character.name);
			cheapReload(cover,{path: cover.pathname})
			cover.style.backgroundImage = "url(" + anime.character.image + ")";
			let content = create("a","content",false,character,"text-align: right;");
			content.href = "/character/" + anime.character.id + "/" + safeURL(anime.character.name);
			cheapReload(content,{path: content.pathname})
			let name = create("a","name",anime.character.name,content);
			roleCard.insertBefore(character,roleCard.children[0]);
			hohCharacterRoles.appendChild(roleCard);
			if(anime.myStatus && !alreadyCounted.has(anime.id)){
				distribution[anime.myStatus.status]++;
				if(anime.myStatus.status === "CURRENT"){
					animeCurrentFlag = true
				}
				sumDuration += Math.max(animeValueFunction(anime),0);
				if(anime.myStatus.scoreRaw){
					sumScoresAnime += anime.myStatus.scoreRaw;
					amountAnime++;
				}
				alreadyCounted.add(anime.id)
			}
		}
	});
	removeChildren(hohMediaRolesAnime)
	let animeYear = 0;
	if(sortSelect.value === "chronological2"){
		animeYear = 3000
	}
	animeRolesList.forEach(anime => {
		let foundRole = filterSelect.value === "";
		if(!foundRole){
			let specificMatch = filterSelect.value.toLowerCase().match(/^\s*(.*?)\s*:\s*(.*)/);
			if(specificMatch && Object.keys(mediaMatcher).includes(specificMatch[1])){
				foundRole = mediaMatcher[specificMatch[1]](specificMatch[2],anime)
			}
			else{
				foundRole = Object.keys(mediaMatcher).some(
					key => mediaMatcher[key](filterSelect.value,anime)
				)
			}
		}
		if(foundRole){
			if(sortSelect.value === "chronological"){
				if((anime.startDate.year || anime.endDate.year) > animeYear){
					animeYear = anime.startDate.year || anime.endDate.year;
					create("h3","hohYearHeading",animeYear,hohMediaRolesAnime)
				}
				else if(!(anime.startDate.year || anime.endDate.year) && animeYear > 0){
					animeYear = 0;
					create("h3","hohYearHeading","No date",hohMediaRolesAnime)
				}
			}
			else if(sortSelect.value === "chronological2"){
				if((anime.startDate.year || anime.endDate.year) < animeYear){
					animeYear = anime.startDate.year || anime.endDate.year;
					create("h3","hohYearHeading",animeYear,hohMediaRolesAnime)
				}
				else if(!(anime.startDate.year || anime.endDate.year) && animeYear > 0){
					animeYear = 0;
					create("h3","hohYearHeading","No date",hohMediaRolesAnime)
				}
			}
			let roleCard = createRoleCard(anime,"anime");
			hohMediaRolesAnime.appendChild(roleCard);
			if(anime.myStatus && !alreadyCounted.has(anime.id)){
				distribution[anime.myStatus.status]++;
				if(anime.myStatus.status === "CURRENT"){
					animeCurrentFlag = true
				}
				sumDuration += Math.max(animeValueFunction(anime),0);
				if(anime.myStatus.scoreRaw){
					sumScoresAnime += anime.myStatus.scoreRaw;
					amountAnime++;
				}
				alreadyCounted.add(anime.id)
			}
		}
	});
	removeChildren(hohMediaRolesManga);
	let mangaYear = 0;
	if(sortSelect.value === "chronological2"){
		mangaYear = 3000
	}
	mangaRolesList.forEach(manga => {
		let foundRole = filterSelect.value === "";
		if(!foundRole){
			let specificMatch = filterSelect.value.toLowerCase().match(/^\s*(.*?)\s*:\s*(.*)/);
			if(specificMatch && Object.keys(mediaMatcher).includes(specificMatch[1])){
				foundRole = mediaMatcher[specificMatch[1]](specificMatch[2],manga)
			}
			else{
				foundRole = Object.keys(mediaMatcher).some(
					key => mediaMatcher[key](filterSelect.value,manga)
				)
			}
		}
		if(foundRole){
			if(sortSelect.value === "chronological"){
				if((manga.startDate.year || manga.endDate.year) > mangaYear){
					mangaYear = manga.startDate.year || manga.endDate.year;
					create("h3","hohYearHeading",mangaYear,hohMediaRolesManga)
				}
				else if(!(manga.startDate.year || manga.endDate.year) && mangaYear > 0){
					mangaYear = 0;
					create("h3","hohYearHeading","No date",hohMediaRolesManga)
				}
			}
			else if(sortSelect.value === "chronological2"){
				if((manga.startDate.year || manga.endDate.year) < mangaYear){
					mangaYear = manga.startDate.year || manga.endDate.year;
					create("h3","hohYearHeading",mangaYear,hohMediaRolesManga)
				}
				else if(!(manga.startDate.year || manga.endDate.year) && mangaYear > 0){
					mangaYear = 0;
					create("h3","hohYearHeading","No date",hohMediaRolesManga)
				}
			}
			let roleCard = createRoleCard(manga,"manga");
			hohMediaRolesManga.appendChild(roleCard);
			if(manga.myStatus){
				distribution[manga.myStatus.status]++;
				if(manga.myStatus.status === "CURRENT"){
					mangaCurrentFlag = true
				}
				const mangaValue = mangaValueFunction(manga);
				sumChapters += mangaValue.chapters;
				sumVolumes += mangaValue.volumes;
				if(manga.myStatus.scoreRaw){
					sumScoresManga += manga.myStatus.scoreRaw;
					amountManga++
				}
			}
		}
	});
	if(sumDuration || sumChapters || sumVolumes || (sumScoresAnime + sumScoresManga)){
		removeChildren(digestStats)
		if(sumDuration){
			create("span",false,translate("$staff_hoursWatched"),digestStats);
			create("span",false,(sumDuration/60).roundPlaces(1),digestStats,"color:rgb(var(--color-blue))")
		}
		if(sumChapters){
			create("span",false,translate("$staff_chaptersRead"),digestStats);
			create("span",false,sumChapters,digestStats,"color:rgb(var(--color-blue))")
		}
		if(sumVolumes){
			create("span",false,translate("$staff_volumesRead"),digestStats);
			create("span",false,sumVolumes,digestStats,"color:rgb(var(--color-blue))")
		}
		if(amountAnime + amountManga){
			create("span",false,translate("$staff_meanScore"),digestStats);
			let averageNode = create("span",false,((sumScoresAnime + sumScoresManga)/(amountAnime + amountManga)).roundPlaces(1),digestStats,"color:rgb(var(--color-blue))");
			if(((sumScoresAnime + sumScoresManga)/(amountAnime + amountManga)) === 10 && userObject.mediaListOptions.scoreFormat === "POINT_10"){//https://anilist.co/activity/49407649
				averageNode.innerText += "/100"
			}
			if(sumScoresAnime && sumScoresManga){
				averageNode.title = "Anime: " + (sumScoresAnime/amountAnime).roundPlaces(1) + "\nManga: " + (sumScoresManga/amountManga).roundPlaces(1);
			}
		}
		let statusList = create("span","#statusList",false,digestStats,"position: absolute;top: -2px;margin-left: 20px;width: 300px;");
		semmanticStatusOrder.forEach(status => {
			if(distribution[status]){
				let statusSumDot = create("div","hohSummableStatus",distribution[status],statusList);
				statusSumDot.style.background = distributionColours[status];
				let title = capitalize(translate("$mediaStatus_" + status.toLowerCase()));
				if(status === "CURRENT" && !animeCurrentFlag){
					title = capitalize(translate("$mediaStatus_reading"))
				}
				else if(status === "CURRENT" && !mangaCurrentFlag){
					title = capitalize(translate("$mediaStatus_watching"))
				}
				statusSumDot.title = distribution[status] + " " + title;
				if(distribution[status] > 99){
					statusSumDot.style.fontSize = "8px"
				}
				if(distribution[status] > 999){
					statusSumDot.style.fontSize = "6px"
				}
				statusSumDot.onclick = function(){
					if(filterSelect.value === "status:" + status.toLowerCase()){
						filterSelect.value = ""
					}
					else{
						filterSelect.value = "status:" + status.toLowerCase()
					}
					filterSelect.dispatchEvent(new Event("input",{bubbles: true}))
				}
			}
		})
	}
};
sortSelect.oninput = listRenderer;
filterSelect.oninput = listRenderer;
let refreshAutocomplete = function(){
	removeChildren(dataList)
	autocomplete.forEach(
		value => create("option",false,false,dataList).value = value
	)
};
let animeHandler = function(data){
	if(data.data.Staff.staffMedia.pageInfo.hasNextPage === true){
		authAPIcall(
			staffQuery,
			{
				page: data.data.Staff.staffMedia.pageInfo.currentPage + 1,
				type: "ANIME",
				id: URLstuff[1]
			},
			animeHandler
		)
	}
	data.data.Staff.staffMedia.edges.forEach(edge => {
		let anime = {
			role: [edge.staffRole],
			format: edge.node.format,
			title: titlePicker(edge.node),
			titleRomaji: edge.node.title.romaji,
			titleEnglish: edge.node.title.english,
			titleNative: edge.node.title.native,
			image: edge.node.coverImage.large,
			startDate: edge.node.startDate,
			endDate: edge.node.endDate,
			id: edge.node.id,
			episodes: edge.node.episodes,
			popularity: edge.node.popularity,
			duration: edge.node.duration || 1,
			status: edge.node.status,
			score: edge.node.averageScore,
			genres: edge.node.genres.map(genre => genre.toLowerCase()),
			tags: edge.node.tags.map(tag => tag.name.toLowerCase()),
			myStatus: edge.node.mediaListEntry,
			type: "ANIME",
			listJSON: edge.node.mediaListEntry ? parseListJSON(edge.node.mediaListEntry.notes) : null
		};
		if(anime.myStatus && anime.myStatus.status === "REPEATING" && anime.myStatus.repeat === 0){
			anime.myStatus.repeat = 1
		}
		autocomplete.add(anime.title);
		autocomplete.add(distributionFormats[anime.format]);
		autocomplete.add(edge.staffRole);
		let parts = edge.staffRole.trim().match(/^(.*?)(\s+\(.*\))?$/);
		let t_role = translate("$role_" + parts[1]);
		if(t_role.substring(0,6) !== "$role_"){
			autocomplete.add(t_role + (parts[2] || ""))
		}
		animeRolesList.push(anime)
	});
	animeRolesList = removeGroupedDuplicates(
		animeRolesList,
		e => e.id,
		(oldElement,newElement) => {
			newElement.role = newElement.role.concat(oldElement.role)
		}
	);
	refreshAutocomplete();
	listRenderer();
};
let mangaHandler = function(data){
	if(data.data.Staff.staffMedia.pageInfo.hasNextPage === true){
		authAPIcall(
			staffQuery,
			{
				page: data.data.Staff.staffMedia.pageInfo.currentPage + 1,
				type: "MANGA",
				id: URLstuff[1]
			},
			mangaHandler
		)
	}
	data.data.Staff.staffMedia.edges.forEach(edge => {
		let manga = {
			role: [edge.staffRole],
			format: edge.node.format,
			title: titlePicker(edge.node),
			titleRomaji: edge.node.title.romaji,
			titleEnglish: edge.node.title.english,
			titleNative: edge.node.title.native,
			image: edge.node.coverImage.large,
			startDate: edge.node.startDate,
			endDate: edge.node.endDate,
			id: edge.node.id,
			chapters: edge.node.chapters,
			volumes: edge.node.volumes,
			popularity: edge.node.popularity,
			status: edge.node.status,
			score: edge.node.averageScore,
			genres: edge.node.genres.map(genre => genre.toLowerCase()),
			tags: edge.node.tags.map(tag => tag.name.toLowerCase()),
			myStatus: edge.node.mediaListEntry,
			type: "MANGA",
			listJSON: edge.node.mediaListEntry ? parseListJSON(edge.node.mediaListEntry.notes) : null
		};
		if(manga.myStatus && manga.myStatus.status === "REPEATING" && manga.myStatus.repeat === 0){
			manga.myStatus.repeat = 1
		}
		autocomplete.add(manga.title);
		autocomplete.add(distributionFormats[manga.format]);
		autocomplete.add(edge.staffRole);
		let parts = edge.staffRole.trim().match(/^(.*?)(\s+\(.*\))?$/);
		let t_role = translate("$role_" + parts[1]);
		if(t_role.substring(0,6) !== "$role_"){
			autocomplete.add(t_role + (parts[2] || ""))
		}
		mangaRolesList.push(manga)
	});
	mangaRolesList = removeGroupedDuplicates(
		mangaRolesList,
		e => e.id,
		(oldElement,newElement) => {
			newElement.role = newElement.role.concat(oldElement.role)
		}
	);
	refreshAutocomplete();
	listRenderer()
};
let voiceHandler = function(data){
	if(data.data.Staff.characters.pageInfo.hasNextPage === true){
		authAPIcall(
			staffVoice,
			{
				page: data.data.Staff.characters.pageInfo.currentPage + 1,
				id: URLstuff[1]
			},
			voiceHandler
		)
	}
	data.data.Staff.characters.edges.forEach(edge => {
		edge.role = capitalize(edge.role.toLowerCase());
		let character = {
			image: edge.node.image.large,
			id: edge.node.id
		}
		if(useScripts.titleLanguage === "NATIVE" && edge.node.name.native){
			character.name = edge.node.name.native
		}
		else{
			character.name = (edge.node.name.first || "") + " " + (edge.node.name.last || "")
		}
		autocomplete.add(edge.role);
		let parts = edge.role.trim().match(/^(.*?)(\s+\(.*\))?$/);
		let t_role = translate("$role_" + parts[1]);
		if(t_role.substring(0,6) !== "$role_"){
			autocomplete.add(t_role + (parts[2] || ""))
		}
		edge.media.forEach(thingy => {
			let anime = {
				role: [edge.role],
				format: thingy.format,
				title: titlePicker(thingy),
				titleRomaji: thingy.title.romaji,
				titleEnglish: thingy.title.english,
				titleNative: thingy.title.native,
				image: thingy.coverImage.large,
				startDate: thingy.startDate,
				endDate: thingy.endDate,
				id: thingy.id,
				episodes: thingy.episodes,
				popularity: thingy.popularity,
				duration: thingy.duration || 1,
				status: thingy.status,
				score: thingy.averageScore,
				myStatus: thingy.mediaListEntry,
				character: character,
				genres: thingy.genres.map(genre => genre.toLowerCase()),
				tags: thingy.tags.map(tag => tag.name.toLowerCase()),
				type: "ANIME",
				listJSON: thingy.mediaListEntry ? parseListJSON(thingy.mediaListEntry.notes) : null
			};
			if(anime.myStatus && anime.myStatus.status === "REPEATING" && anime.myStatus.repeat === 0){
				anime.myStatus.repeat = 1;
			}
			autocomplete.add(anime.title);
			voiceRolesList.push(anime)
		})
	});
	refreshAutocomplete();
	listRenderer();
};
const staffQuery = `
query($id: Int,$page: Int,$type: MediaType){
	Staff(id: $id){
		staffMedia(
			sort: POPULARITY_DESC,
			type: $type,
			page: $page
		){
			edges{
				staffRole
				node{
					id
					format
					episodes
					chapters
					volumes
					popularity
					duration
					status
					averageScore
					coverImage{large}
					startDate{year month day}
					endDate{year month day}
					title{romaji native english}
					tags{name}
					genres
					mediaListEntry{
						status
						progress
						progressVolumes
						repeat
						notes
						scoreRaw: score(format: POINT_100)
					}
				}
			}
			pageInfo{
				currentPage
				lastPage
				hasNextPage
			}
		}
	}
}`;
const staffVoice = `
query($id: Int,$page: Int){
	Staff(id: $id){
		characters(
			sort: ID,
			page: $page
		){
			edges{
				node{
					id
					image{large}
					name{first last native}
				}
				role
				media{
					id
					format
					episodes
					chapters
					volumes
					popularity
					duration
					status
					averageScore
					coverImage{large}
					startDate{year month day}
					endDate{year month day}
					title{romaji native english}
					tags{name}
					genres
					mediaListEntry{
						status
						progress
						progressVolumes
						repeat
						notes
						scoreRaw: score(format: POINT_100)
					}
				}
			}
			pageInfo{
				currentPage
				lastPage
				hasNextPage
			}
		}
	}
}`;
const variables = {
	page: 1,
	id: URLstuff[1]
};
authAPIcall(staffQuery,Object.assign({type:"ANIME"},variables),animeHandler);
authAPIcall(staffQuery,Object.assign({type:"MANGA"},variables),mangaHandler);
authAPIcall(staffVoice,variables,voiceHandler)
};
selfcaller();
	}
})
//end modules/replaceStaffRoles.js
//begin modules/rightSideNavbar.js
exportModule({
	id: "rightSideNavbar",
	description: "$rightSideNavbar_description",
	isDefault: false,
	categories: ["Navigation"],
	visible: true
})
//end modules/rightSideNavbar.js
//begin modules/scoreOverviewFixer.js
function scoreOverviewFixer(){
	if(!document.URL.match(/^https:\/\/anilist\.co\/(anime|manga)\//)){
		return;
	}
	let overview = document.querySelector(".media .overview");
	if(!overview){
		setTimeout(scoreOverviewFixer,300);
		return;
	}
	let follows = overview.querySelectorAll(".follow");
	if(follows.length){
		follows.forEach(el => {
			scoreColors(el);
		});
	}
	else{
		setTimeout(scoreOverviewFixer,300);
	}
}
//end modules/scoreOverviewFixer.js
//begin modules/selectMyThreads.js
function selectMyThreads(){
	if(document.URL !== "https://anilist.co/user/" + whoAmI + "/social#my-threads"){
		return
	}
	let target = document.querySelector(".filter-group span:nth-child(4)");
	if(!target){
		setTimeout(selectMyThreads,100)
	}
	else{
		target.click()
	}
}
//end modules/selectMyThreads.js
//begin modules/selfInsert.js
exportModule({
	boneless_disable: true,
	id: "selfInsert",
	description: "add " + script_type + " to the apps page",
	isDefault: true,
	categories: ["Script"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url.match("https://anilist.co/apps")
	},
	code: function(){
		let waiter = function(){
			if(!document.URL.match("https://anilist.co/apps")){
				return
			}
			if(document.querySelector(".app.hohscript")){
				return
			}
			let location = document.querySelector("[href=\"https://www.animouto.moe/\"]");
			if(!location){
				setTimeout(waiter,500)
				return
			}
			if(
				location.parentNode.childNodes.length % 3 !== 0
				&& location.parentNode.childNodes.length % 2 !== 0
			){//two or three per row, so only fill the gap if we can make the symmetry pleasing
				let app = location.cloneNode(true);
				app.classList.add("hohscript");
				app.href = scriptInfo.link;
				app.children[0].src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAMAAAAL3/3yAAAA1VBMVEUfJjKXHyngDxb6AwXAGCH/AADBAAByAAA4AAAWAAAFAABzAADCAAAeJTEVGiMEBQkAAAAEBgkYHigFBwsFBwwUGSITGCEPExsUGiMZH5kLD+ECA/oAAP8AAMAAYgAAgAACfQULcRYZTykTGMIAAHEAOgATYiEAADcAHQAAABUADAAAAAYABAACA/kCfQYAADgAHgAAAHMAOwAAAMIAYwAVGiQFCAwYHikTGSLDwwB0dAA6OgAXFwAGBgB1dQDExAD//wD5+QX5+Qbg4RaXlynAwSH6+gXAOZK3AAABlUlEQVR42u3ZA4IsMRRG4b8tpW0+m2Nz/0t6rB7mZszzLeFUxQIA4K7E4olEPCaEKZn6KykExVL/xYSQeBQrLoQkolgJISQ1J4QQi1jEIhaxiAViEYtYxCIWsUAsYhGLWMQiFohFLGIRi1jEQjqTzeXzuWyhKJhK5Yqbq5ZLglet7k5o1ASPpjujJZyr7c7RFs7RcpHQv4Wa86gJp5QazqNeEk7qOK+ycFLFeVX1DHV7/YHP0BlGY5/JdKYn6cXA8NIZXo0Nr/UEdQeWN87wdmyZ6enpDSzvnOH92DLV09MfWD44w8exZaKn59Ntxfqsi2MYPrsJ/oszfLUn+Ge3dfjmDN/NrcPz25T+cIaf5qb0Gapy3Lm4svNaEE4qLd7AFQ2Xf0vCRa+Vl4U7fLDgKQy1hjthcUnwKi1U3Vx1oSSYVlbX1jc21tc2t4SQ7TkhhFjEIhaxiEUsEItYxCIWsYgFYhGLWMQiFrFALGIRi1jEIhZ2ola7QsheFGtPCNmPYu0LQQf/Wh1ICNvfOzzc2xcAAHfkF2ouxpBwdu2dAAAAAElFTkSuQmCC";
				app.children[1].textContent = script_type;
				location.parentNode.appendChild(app)
			}
		};
		waiter()
	}
})
//end modules/selfInsert.js
//begin modules/settingsPage.js
//https://stackoverflow.com/questions/1911000/detecting-individual-unicode-character-support-with-javascript
//The first argument is the character you want to test, and the second argument is the font you want to test it in.
//If the second argument is left out, it defaults to the font of the <body> element.
//The third argument isn't used under normal circumstances, it's just used internally to avoid infinite recursion.
function characterIsSupported(character, font = getComputedStyle(document.body).fontFamily, recursion = false){
    //Create the canvases
    let testCanvas = document.createElement("canvas");
    let referenceCanvas = document.createElement("canvas");
    testCanvas.width = referenceCanvas.width = testCanvas.height = referenceCanvas.height = 150;

    //Render the characters
    let testContext = testCanvas.getContext("2d");
    let referenceContext = referenceCanvas.getContext("2d");
    testContext.font = referenceContext.font = "100px " + font;
    testContext.fillStyle = referenceContext.fillStyle = "black";
    testContext.fillText(character, 0, 100);
    referenceContext.fillText('\uffff', 0, 100);
    
    //Firefox renders unsupported characters by placing their character code inside the rectangle making each unsupported character look different.
    //As a workaround, in Firefox, we hide the inside of the character by placing a black rectangle on top of it.
    //The rectangle we use to hide the inside has an offset of 10px so it can still see part of the character, reducing the risk of false positives.
    //We check for Firefox and browers that behave similarly by checking if U+FFFE is supported, since U+FFFE is, just like U+FFFF, guaranteed not to be supported.
    if(!recursion && characterIsSupported('\ufffe', font, true)){
        testContext.fillStyle = referenceContext.fillStyle = "black";
        testContext.fillRect(10, 10, 80, 80);
        referenceContext.fillRect(10, 10, 80, 80);
    }

    //Check if the canvases are identical
    return testCanvas.toDataURL() != referenceCanvas.toDataURL();
}

const infoChar = (characterIsSupported("🛈") ? "🛈" : "i");
const downloadChar = (characterIsSupported("⭳") ? "⭳" : "↓");

exportModule({
	id: "settingsPage",
	description: "This settings page",
	isDefault: true,//must be true
	categories: ["Script"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url === "https://anilist.co/settings/apps"
	},
	code: function(){
		if(location.pathname !== "/settings/apps"){
			return
		}
		if(document.getElementById("hohSettings")){
			return
		}
		let targetLocation = document.querySelector(".settings.container .content");
		let hohSettings = create("div","#hohSettings",false,targetLocation);
		hohSettings.classList.add("all");
		let scriptStatsHead = create("h1",false,translate("$settings_title"),hohSettings);
		let scriptStats = create("div",false,false,hohSettings);
		let sVersion = create("p",false,false,scriptStats);
		create("span",false,translate("$settings_version"),sVersion);
		create("span","hohStatValue",scriptInfo.version,sVersion);
		let sHome = create("p",false,translate("$settings_homepage"),scriptStats);
		let sHomeLink = create("a","external",scriptInfo.link,sHome);
		sHomeLink.href = scriptInfo.link;
		let sHome2 = create("p",false,translate("$settings_repository"),scriptStats);
		let sHomeLink2 = create("a","external",scriptInfo.repo,sHome2);
		sHomeLink2.href = scriptInfo.repo;
		if(!useScripts.accessToken){
			if(script_type === "Boneless"){
				create("p",false,"Faded options only have limited functionallity without signing in to the script (scroll down to the bottom of the page for that) which also requires persistent cookies",scriptStats)
			}
			else{
				create("p",false,"Faded options only have limited functionallity without signing in to the script (scroll down to the bottom of the page for that) which also requires persistent cookies, see https://github.com/hohMiyazawa/Automail/issues/26#issuecomment-623677462",scriptStats)
			}
		}
		let categories = create("div",["container","hohCategories"],false,scriptStats);
		let catList = ["Notifications","Feeds","Forum","Lists","Profiles","Stats","Media","Navigation","Browse","Script","Login","Newly Added"];
		let activeCategory = "";
		catList.forEach(function(category){
			let catBox = create("div","hohCategory",translate("$settings_category_" + category),categories);
			catBox.onclick = function(){
				hohSettings.className = "";
				if(activeCategory === category){
					catBox.classList.remove("active");
					activeCategory = "";
					hohSettings.classList.add("all");
				}
				else{
					if(activeCategory !== ""){
						categories.querySelector(".hohCategory.active").classList.remove("active")
					}
					catBox.classList.add("active");
					hohSettings.classList.add(category.replace(" ",""));
					activeCategory = category
				}
			}
		});
		let scriptSettings = create("div",false,false,hohSettings);
		if(!useScripts.accessToken){
			scriptSettings.classList.add("noLogin")
		}
		useScriptsDefinitions.sort((b,a) => (a.importance || 0) - (b.importance || 0));
		useScriptsDefinitions.forEach(function(def){
			let setting = create("p","hohSetting",false,scriptSettings);
			if(def.visible === false || (script_type === "Boneless" && def.boneless_disable)){
				setting.style.display = "none"
			}
			if(hasOwn(def, "type")){//other kinds of input
				let input;
				if(def.type === "select"){
					input = create("select",false,false,setting);
					if(def.id === "partialLocalisationLanguage"){
						//English stafff credits aren't included in the files since the site is already in English, but we still want to estimate the amount
						const nativeEnglishRoleCount = Object.keys(languageFiles["Norsk"].keys).filter(e => e.substring(0,6) === "$role_").length;
						def.values.forEach(
							value => create("option",false,value + " (" + Math.max(
									Object.keys(languageFiles[value].keys).length
									+ (value === "English" ? nativeEnglishRoleCount : 0),
									(
										languageFiles[value].info.variation_of
										?
										Object.keys(languageFiles[languageFiles[value].info.variation_of].keys).length	
										+ (languageFiles[value].info.variation_of === "English" ? nativeEnglishRoleCount : 0)
										:
										0
									)
								) + " keys) [" + (languageFiles[value].info.translators ? languageFiles[value].info.translators.join(", ") : languageFiles[value].info.maintainer) + "]",input)
								.value = value
						)
					}
					else{
						if(def.displayValues){
							def.values.forEach(
								(value,index) => create("option",false,translate(def.displayValues[index]),input)
									.value = value
							)
						}
						else{
							def.values.forEach(
								value => create("option",false,value,input)
									.value = value
							)
						}
					}
				}
				else if(def.type === "text"){
					input = create("input",false,false,setting)
				}
				else if(def.type === "number"){
					input = create("input",false,false,setting);
					input.type = "number";
					if(def.min !== undefined){
						input.setAttribute("min",def.min)
					}
					if(def.max){
						input.setAttribute("max",def.max)
					}
				}
				if(def.type !== "heading"){
					input.targetSetting = def.id;
					input.value = useScripts[def.id];
					input.onchange = function(){
						useScripts[this.targetSetting] = this.value;
						useScripts.save()
					}
				}
			}
			else{//default: a checkbox
				let input = createCheckbox(setting);
				input.targetSetting = def.id;
				input.checked = useScripts[def.id];
				input.onchange = function(){
					useScripts[this.targetSetting] = this.checked;
					useScripts.save();
					initCSS();
					if(!this.checked && def.destructor){
						def.destructor()
					}
					if(this.checked && def.css){
						moreStyle.textContent += def.css
					}
				}
			}
			if(def.categories){
				def.categories.forEach(
					category => {
						if(catList.includes(category)){
							setting.classList.add(category.replace(/\s/g,""))
						}
						else{
							console.warn("Unknown category '" + category + "' for module '" + def.id + "'")
						}
					}
				)
			}
			create("span",false,translate(def.description),setting);
			if(def.extendedDescription){
				let infoButton = create("span","hohInfoButton",null,setting);
				infoButton.title = translate("$settings_moreInfo_tooltip");
				infoButton.appendChild(svgAssets2.info.cloneNode(true))
				infoButton.onclick = function(){
					createDisplayBox(false,translate("$extendedDescription_windowTitle")).innerText = translate(def.extendedDescription)
				}
			}
		});
		let titleAliasSettings = create("div");
		let titleAliasInstructions = create("p");
		titleAliasInstructions.innerText = translate("$settings_aliasHelp");
		let titleAliasInput = create("textarea","#titleAliasInput");
		(
			JSON.parse(localStorage.getItem("titleAliases")) || []
		).forEach(
			alias => titleAliasInput.value += alias[0] + alias[1] + "\n"
		);
		titleAliasInput.rows = "6";
		titleAliasInput.cols = "50";
		let titleAliasChange = create("button",["hohButton","button"],translate("$button_submit"));
		titleAliasChange.onclick = function(){
			let newAliases = [];
			let aliasContent = titleAliasInput.value.split("\n");
			let aliasRegex = /^(\/(anime|manga)\/\d+\/)(.*)/;
			let cssAlias = /^(css\/)(.*)/;
			aliasContent.forEach(content => {
				let matches = content.match(aliasRegex);
				if(!matches){
					let cssMatches = content.match(cssAlias);
					if(cssMatches){
						newAliases.push([cssMatches[1],cssMatches[2]])
					}
					return
				}
				newAliases.push([matches[1],matches[3]]);
			});
			localStorage.setItem("titleAliases",JSON.stringify(newAliases))
		};
		titleAliasSettings.appendChild(create("hr"));
		titleAliasSettings.appendChild(titleAliasInstructions);
		titleAliasSettings.appendChild(titleAliasInput);
		create("br",false,false,titleAliasSettings);
		titleAliasSettings.appendChild(titleAliasChange);
		titleAliasSettings.appendChild(create("hr"));
		hohSettings.appendChild(titleAliasSettings);
		//
		let notificationColour = create("div");
		if(useScripts.accessToken){
			const notificationTypes = Object.keys(notificationColourDefaults);
			const supportedColours = [
				{name:translate("$colour_transparent"),value:"rgb(0,0,0,0)"},
				{name:translate("$colour_blue"),value:"rgb(61,180,242)"},
				{name:translate("$colour_white"),value:"rgb(255,255,255)"},
				{name:translate("$colour_black"),value:"rgb(0,0,0)"},
				{name:translate("$colour_red"),value:"rgb(232,93,117)"},
				{name:translate("$colour_peach"),value:"rgb(250,122,122)"},
				{name:translate("$colour_orange"),value:"rgb(247,154,99)"},
				{name:translate("$colour_yellow"),value:"rgb(247,191,99)"},
				{name:translate("$colour_green"),value:"rgb(123,213,85)"}
			];
			create("p",false,translate("$settings_notificationDotColour"),notificationColour);
			let nColourType = create("select",false,false,notificationColour);
			let nColourValue = create("select",false,false,notificationColour);
			let supressOption = createCheckbox(notificationColour);
			let supressOptionText = create("span",false,translate("$settings_notificationDot_None"),notificationColour);
			notificationTypes.forEach(
				type => create("option",false,type,nColourType)
					.value = type
			);
			supportedColours.forEach(
				colour => create("option",false,colour.name,nColourValue)
					.value = colour.value
			);
			create("br",false,false,notificationColour);
			let resetAll = create("button",["hohButton","button"],translate("$button_resetAll"),notificationColour);
			resetAll.onclick = function(){
				useScripts.notificationColours = notificationColourDefaults;
				useScripts.save();
			};
			nColourType.oninput = function(){
				nColourValue.value = useScripts.notificationColours[nColourType.value].colour;
				supressOption.checked = useScripts.notificationColours[nColourType.value].supress;
			};
			nColourValue.oninput = function(){
				useScripts.notificationColours[nColourType.value].colour = nColourValue.value;
				useScripts.save();
			};
			supressOption.oninput = function(){
				useScripts.notificationColours[nColourType.value].supress = supressOption.checked;
				useScripts.save()
			};
			nColourValue.value = useScripts.notificationColours[nColourType.value].colour;
			supressOption.checked = useScripts.notificationColours[nColourType.value].supress;
			hohSettings.appendChild(notificationColour);
		}
		hohSettings.appendChild(create("hr"));
		let blockList = localStorage.getItem("blockList");
		if(blockList){
			blockList = JSON.parse(blockList)
		}
		else{
			blockList = []
		}
		let blockSettings = create("div");
		let blockInstructions = create("p",false,false,blockSettings);
		blockInstructions.innerText = translate("$settings_blockInstructions");
		let blockInput = create("div","#blockInput",false,blockSettings);
		create("span",false,translate("$settings_blockUser") + " ",blockInput);
		let blockUserInput = create("input",false,false,blockInput,"width:100px;margin-right:10px;");
		blockUserInput.value = "";
		create("span",false," " + translate("$settings_blockStatus") + " ",blockInput);
		let blockStatusInput = create("select",false,false,blockInput,"margin-right:10px;");
		const blockStatuses = ["","all","status","progress","anime","manga","planning","watching","reading","pausing","dropping","rewatching","rereading","rewatched","reread"];
		blockStatuses.forEach(
			status => create("option",false,(status ? capitalize(translate("$blockStatus_" + status)) : ""),blockStatusInput)
				.value = status
		);
		blockStatusInput.value = "";
		create("span",false," " + translate("$settings_blockMediaId") + " ",blockInput);
		let blockMediaInput = create("input",false,false,blockInput,"width:100px;margin-right:10px;");
		blockMediaInput.type = "number";
		blockMediaInput.value = "";
		blockMediaInput.min = 1;
		blockMediaInput.addEventListener("paste",function(e){
			let clipboardData = e.clipboardData || window.clipboardData;
			if(!clipboardData){//don't mess with paste
				return
			}
			let pastedData = clipboardData.getData("Text");
			if(!pastedData){
				return
			}
			e.stopPropagation();
			e.preventDefault();
			let possibleFullURL = pastedData.match(/(anime|manga)\/(\d+)\/?/);
			if(possibleFullURL){
				blockMediaInput.value = parseInt(possibleFullURL[2])
			}
			else{
				blockMediaInput.value = pastedData
			}
		});
		let blockAddInput = create("button",["button","hohButton"],translate("$button_add"),blockInput);
		let blockVisual = create("div",false,false,blockSettings);
		let drawBlockList = function(){
			removeChildren(blockVisual)
			blockList.forEach(function(blockItem,index){
					let item = create("div","hohBlock",false,blockVisual);
					let cross = create("span","hohBlockCross",svgAssets.cross,item);
					cross.onclick = function(){
						blockList.splice(index,1);
						localStorage.setItem("blockList",JSON.stringify(blockList));
						drawBlockList();
					};
					if(blockItem.user){
						create("span","hohBlockSpec",blockItem.user,item)
					}
					if(blockItem.status){
						create("span","hohBlockSpec",capitalize(blockItem.status),item)
					}
					if(blockItem.media){
						create("span","hohBlockSpec","ID:" + blockItem.media,item)
					}
			})
		};drawBlockList();
		blockAddInput.onclick = function(){
			let newBlock = {
				user: false,
				status: false,
				media: false
			};
			if(blockUserInput.value){
				newBlock.user = blockUserInput.value
			}
			if(blockStatusInput.value){
				newBlock.status = blockStatusInput.value
			}
			if(blockMediaInput.value){
				newBlock.media = blockMediaInput.value
			}
			if(newBlock.user || newBlock.status || newBlock.media){
				blockList.push(newBlock);
				localStorage.setItem("blockList",JSON.stringify(blockList));
				drawBlockList();
			}
		};
		hohSettings.appendChild(blockSettings);
		//
		hohSettings.appendChild(create("hr"));
		if(useScripts.profileBackground && useScripts.accessToken){
			let backgroundSettings = create("div",false,false,hohSettings);
			create("p",false,translate("$profileBackground_help1"),backgroundSettings);
			create("pre","hohCode","red",backgroundSettings);
			create("pre","hohCode","#640064",backgroundSettings);
			create("pre","hohCode","url(https://www.example.com/myBackground.jpg)",backgroundSettings);
			create("p",false,translate("$profileBackground_help2"),backgroundSettings);
			create("pre","hohCode","rgb(100,0,100,0.4)",backgroundSettings);
			create("p",false,translate("$profileBackground_help3"),backgroundSettings);
			create("pre","hohCode","linear-gradient(rgb(var(--color-background),0.8),rgb(var(--color-background),0.8)), url(https://www.example.com/myBackground.jpg) center/100% fixed",backgroundSettings);
			let inputField = create("input",false,false,backgroundSettings);
			inputField.value = useScripts.profileBackgroundValue;
			create("br",false,false,backgroundSettings);
			let backgroundChange = create("button",["hohButton","button"],translate("$button_submit"),backgroundSettings);
			backgroundChange.onclick = function(){
				useScripts.profileBackgroundValue = inputField.value;
				useScripts.save();
				let jsonMatch = (userObject.about || "").match(/^\[\]\(json([A-Za-z0-9+/=]+)\)/);
				let profileJson = {};
				if(jsonMatch){
					try{
						profileJson = JSON.parse(atob(jsonMatch[1]))
					}
					catch(e){
						try{
							profileJson = JSON.parse(LZString.decompressFromBase64(jsonMatch[1]))
						}
						catch(e){
							console.warn(translate("$settings_errorInvalidJSON"))
						}
					}
				}
				profileJson.background = useScripts.profileBackgroundValue;
				if(!profileJson.background){
					delete profileJson["background"]
				}
				//let newDescription = "[](json" + btoa(JSON.stringify(profileJson)) + ")" + (userObject.about.replace(/^\[\]\(json([A-Za-z0-9+/=]+)\)/,""));
				let newDescription = "[](json" + LZString.compressToBase64(JSON.stringify(profileJson)) + ")" + ((userObject.about || "").replace(/^\[\]\(json([A-Za-z0-9+/=]+)\)/,""));
				authAPIcall(
					`mutation($about: String){
						UpdateUser(about: $about){
							about
						}
					}`,
					{about: newDescription},function(data){
						if(!data){
							return
						}
						deleteCacheItem("hohProfileBackground" + whoAmI)
					}
				)
			};
			hohSettings.appendChild(create("hr"));
		}
		if(useScripts.customCSS && useScripts.accessToken && script_type !== "Boneless"){
			let backgroundSettings = create("div",false,false,hohSettings);
			create("p",false,translate("$settings_CSSadd"),backgroundSettings);
			let inputField = create("textarea",false,false,backgroundSettings,"width: 100%;scrollbar-width: auto;");
			inputField.value = useScripts.customCSSValue;
			if(inputField.value){
				inputField.rows = 10
			}
			else{
				inputField.rows = 4
			}
			create("br",false,false,backgroundSettings);
			create("p",false,translate("$settings_CSSlinkTip"),backgroundSettings);
			let backgroundChange = create("button",["hohButton","button"],translate("$button_submit"),backgroundSettings);
			backgroundChange.onclick = function(){
				useScripts.customCSSValue = inputField.value;
				let jsonMatch = (userObject.about || "").match(/^\[\]\(json([A-Za-z0-9+/=]+)\)/);
				let profileJson = {};
				if(jsonMatch){
					try{
						profileJson = JSON.parse(atob(jsonMatch[1]))
					}
					catch(e){
						try{
							profileJson = JSON.parse(LZString.decompressFromBase64(jsonMatch[1]))
						}
						catch(e){
							console.warn(translate("$settings_errorInvalidJSON"))
						}
					}
				}
				profileJson.customCSS = useScripts.customCSSValue;
				if(!profileJson.customCSS){
					delete profileJson["customCSS"]
				}
				//let newDescription = "[](json" + btoa(JSON.stringify(profileJson)) + ")" + (userObject.about.replace(/^\[\]\(json([A-Za-z0-9+/=]+)\)/,""));
				let newDescription = "[](json" + LZString.compressToBase64(JSON.stringify(profileJson)) + ")" + ((userObject.about || "").replace(/^\[\]\(json([A-Za-z0-9+/=]+)\)/,""));
				if(newDescription.length > 1e6){
					alert(translate("$cssTooBig"))
				}
				else{
					useScripts.save();
					authAPIcall(
						`mutation($about: String){
							UpdateUser(about: $about){
								about
							}
						}`,
						{about: newDescription},
						function(data){
							if(!data){
								alert("failed to save custom CSS")
							}
							deleteCacheItem("hohProfileBackground" + whoAmI)
						}
					)
				}
			};
			hohSettings.appendChild(create("hr"))
		}
		if(useScripts.customCSS && useScripts.accessToken && script_type !== "Boneless"){
			let pinSettings = create("div",false,false,hohSettings);
			create("p",false,translate("$settings_pinnedActivity"),pinSettings);
			let inputField = create("input",false,false,pinSettings);
			inputField.value = useScripts.pinned;
			inputField.setAttribute("placeholder","activity link");
			create("br",false,false,pinSettings);
			let pinChange = create("button",["hohButton","button"],translate("$button_submit"),pinSettings);
			let hohSpinner = create("span","hohSpinner","",pinSettings);
			pinChange.onclick = function(){
				hohSpinner.innerText = svgAssets.loading;
				hohSpinner.classList.remove("spinnerError");
				hohSpinner.classList.remove("spinnerDone");
				hohSpinner.classList.add("spinnerLoading");
				let activityID = parseInt(inputField.value);
				if(inputField.value !== ""){
					if(!activityID){
						let matches = inputField.value.match(/^https:\/\/anilist\.co\/activity\/(\d+)\/?$/);
						if(matches){
							activityID = parseInt(matches[1])
						}
					}
					if(!activityID){
						alert(translate("$settings_errorInvalidActivity"));
						hohSpinner.innerText = svgAssets.cross;
						hohSpinner.classList.add("spinnerError");
						hohSpinner.classList.remove("spinnerLoading");
						return
					}
					generalAPIcall(
`
query{
	Activity(id: ${activityID}){
		... on ListActivity{
			id
		}
		... on MessageActivity{
			id
		}
		... on TextActivity{
			id
		}
	}
}
`,
						{},
						function(data){
							if(!data){
								hohSpinner.innerText = svgAssets.cross;
								hohSpinner.classList.add("spinnerError");
								hohSpinner.classList.remove("spinnerLoading");
								hohSpinner.classList.remove("spinnerDone");
								alert(translate("$settings_errorInvalidActivity"))
							}
						}
					)
				}
				else{
					activityID = ""
				}
				useScripts.pinned = activityID;
				let jsonMatch = (userObject.about || "").match(/^\[\]\(json([A-Za-z0-9+/=]+)\)/);
				let profileJson = {};
				if(jsonMatch){
					try{
						profileJson = JSON.parse(atob(jsonMatch[1]))
					}
					catch(e){
						try{
							profileJson = JSON.parse(LZString.decompressFromBase64(jsonMatch[1]))
						}
						catch(e){
							hohSpinner.innerText = svgAssets.cross;
							hohSpinner.classList.add("spinnerError");
							hohSpinner.classList.remove("spinnerLoading");
							console.warn(translate("$settings_errorInvalidJSON"));
							return
						}
					}
				}
				profileJson.pinned = useScripts.pinned;
				if(!profileJson.pinned){
					delete profileJson["pinned"]
				}
				let newDescription = "[](json" + LZString.compressToBase64(JSON.stringify(profileJson)) + ")" + ((userObject.about || "").replace(/^\[\]\(json([A-Za-z0-9+/=]+)\)/,""));
				if(newDescription.length > 1e6){
					hohSpinner.innerText = svgAssets.cross;
					hohSpinner.classList.add("spinnerError");
					hohSpinner.classList.remove("spinnerLoading");
					alert(translate("$jsonTooBig"))
				}
				else{
					useScripts.save();
					authAPIcall(
						`mutation($about: String){
							UpdateUser(about: $about){
								about
							}
						}`,
						{about: newDescription},
						function(data){
							if(!data){
								hohSpinner.innerText = svgAssets.cross;
								hohSpinner.classList.add("spinnerError");
								hohSpinner.classList.remove("spinnerLoading");
								alert("failed to save pinned activity")
							}
							else{
								hohSpinner.innerText = svgAssets.check;
								hohSpinner.classList.add("spinnerDone");
								hohSpinner.classList.remove("spinnerLoading");
							}
							deleteCacheItem("hohProfileBackground" + whoAmI)
						}
					)
				}
			};
			hohSettings.appendChild(create("hr"))
		}

		create("p",false,translate("$settings_resetDefaultSettings"),hohSettings);
		let cleanEverything= create("button",["hohButton","button","danger"],translate("$button_defaultSettings"),hohSettings);
		cleanEverything.onclick = function(){
			localStorage.removeItem("hohSettings");
			window.location.reload(false);
		}
		create("hr","hohSeparator",false,hohSettings);
		let loginURL = create("a",false,translate("$terms_signin_link"),hohSettings,"font-size: x-large;");
		loginURL.href = authUrl;
		loginURL.style.color = "rgb(var(--color-blue))";
		create("p",false,translate("$terms_signin_description"),hohSettings);
		if(script_type !== "Boneless"){
			create("h4",false,translate("$terms_signin_selfhost_title"),hohSettings);
			create("p",false,translate("$terms_signin_selfhost_line1"),hohSettings);
			create("p",false,translate("$terms_signin_selfhost_line2"),hohSettings);
			create("p",false,translate("$terms_signin_selfhost_line3"),hohSettings);
			let ele = create("p",false,"4. ",hohSettings);
			let lonk = create("span",false,translate("$terms_signin_selfhost_line4"),ele,"color:rgb(var(--color-blue));cursor:pointer");
			lonk.onclick = function(){
				let id = parseInt(prompt(translate("$terms_signin_selfhost_clientid")));
				if(id){
					useScripts.client_id = id;
					useScripts.save();
					window.location = "https://anilist.co/api/v2/oauth/authorize?client_id=" + id + "&response_type=token"
				}
				else{
					alert(translate("$terms_signin_selfhost_error_client_not_found"))
				}
			}
			if(useScripts.accessToken){
				create("hr","hohSeparator",false,hohSettings);
				create("p",false,translate("$settings_currentAccessToken"),hohSettings);
				create("p","hohMonospace",useScripts.accessToken,hohSettings,"word-wrap: anywhere;font-size: small;line-break: anywhere;")
			}
		}

		hohSettings.appendChild(create("hr"));

		let debugInfo = create("button",["hohButton","button"],translate("$settings_button_export"),hohSettings);
		create("p",false,translate("$settings_export_description"),hohSettings);
		create("p",false,translate("$settings_import"),hohSettings);
		let debugImport = create("input","input-file",false,hohSettings);
		debugImport.setAttribute("type","file");
		debugImport.setAttribute("name","json");
		debugImport.setAttribute("accept","application/json");
		debugInfo.onclick = function(){
			let export_settings = JSON.parse(JSON.stringify(useScripts));//deepclone
			if(export_settings.accessToken){//idiot proofing: we don't want users leaking their access tokens
				export_settings.accessToken = "[REDACTED]"
			}
			if(whoAmI){
				saveAs(export_settings,script_type + "_settings_" + whoAmI + ".json")
			}
			else{
				saveAs(export_settings,script_type + "_settings.json")
			}
		}
		debugImport.oninput = function(){
			let reader = new FileReader();
			reader.readAsText(debugImport.files[0],"UTF-8");
			reader.onload = function(evt){
				let data;
				try{
					data = JSON.parse(evt.target.result)
				}
				catch(e){
					alert(translate("$error_JSONparsing"))
					return
				}
				if(!hasOwn(data, "socialTab")){//sanity check
					alert(translate("$settings_import_error_invalid_file"))
					return
				}
				Object.keys(data).forEach(//this is to keep the default settings if the version imported is outdated
					key => {
						if(key === "accessToken"){
							if(!useScripts.accessToken && data[key] === "[REDACTED]"){
								alert(translate("$settings_import_token_not_saved"))
							}
						}
						else{
							useScripts[key] = data[key]
						}
					}
				)
				useScripts.save();
				alert(translate("$settings_import_successful"))
			}
			reader.onerror = function(evt){
				alert(translate("$settings_import_error_reading_file"))
			}
		}
		create("p",false,translate("$debug_tip"),hohSettings);
	}
})
//end modules/settingsPage.js
//begin modules/showMarkdown.js
function showMarkdown(id){
	if(!location.pathname.match(id)){
		return
	}
	if(document.querySelector(".hohGetMarkdown")){
		return
	}
	let timeContainer = document.querySelector(".activity-text .time,.activity-message .time");
	if(!timeContainer){
		setTimeout(function(){showMarkdown(id)},200);
		return
	}
	if(!useScripts.accessToken && document.querySelector(".private-badge")){
		return//can't fetch private messages without privileges
	}
	let codeLink = create("span",["action","hohGetMarkdown"],"</>",false,"font-weight:bolder;");
	timeContainer.insertBefore(codeLink,timeContainer.firstChild);
	codeLink.onclick = function(){
		let activityMarkdown = document.querySelector(".activity-markdown");
		if(activityMarkdown.style.display === "none"){
			let markdownSource = document.querySelector(".hohMarkdownSource");
			if(markdownSource){
				markdownSource.style.display = "none"
			}
			activityMarkdown.style.display = "initial"
		}
		else{
			activityMarkdown.style.display = "none";
			let markdownSource = document.querySelector(".hohMarkdownSource");
			if(markdownSource){
				markdownSource.style.display = "initial"
			}
			else{
				const caller = (document.querySelector(".private-badge") ? authAPIcall : generalAPIcall);
				caller("query($id:Int){Activity(id:$id){...on MessageActivity{text:message}...on TextActivity{text}}}",{id:id},function(data){
					if(!location.pathname.match(id)){
						return
					}
					if(!data){
						markdownSource = create("div",["activity-markdown","hohMarkdownSource","hohError"],translate("$error_markdown"),activityMarkdown.parentNode);
						return
					}
					markdownSource = create("div",["activity-markdown","hohMarkdownSource"],data.data.Activity.text,activityMarkdown.parentNode);
				},"hohGetMarkdown" + id,20*1000)
			}
		}
	}
}
//end modules/showMarkdown.js
//begin modules/singleActivityReplyLikes.js
exportModule({
	id: "singleActivityReplyLikes",
	description: "Add like tooltips to all replies when viewing a single activity",
	isDefault: true,
	categories: ["Feeds"],
	visible: false,
	urlMatch: function(url,oldUrl){
		return url.match(/^https:\/\/anilist\.co\/activity\/(\d+)/)
	},
	code: function singleActivityReplyLikes(){
		let id = parseInt(document.URL.match(/^https:\/\/anilist\.co\/activity\/(\d+)/)[1])
		let adder = function(data){
			if(!data){
				return//private actitivites, mostly. Doesn't matter as there aren't many people there.
			}
			if(!document.URL.includes("activity/" + id || !data)){
				return
			}
			let post = document.querySelector(".activity-entry > .wrap > .actions .action.likes");
			if(!post){
				setTimeout(function(){adder(data)},200);
				return
			}
			post.classList.add("hohLoadedLikes");
			post.classList.add("hohHandledLike");
			if(post.querySelector(".count") && !(parseInt(post.querySelector(".count").innerText) <= 5)){
				post.title = data.data.Activity.likes.map(like => like.name).join("\n")
			}
			let smallAdder = function(){
				if(!document.URL.includes("activity/" + id)){
					return
				}
				let actionLikes = document.querySelectorAll(".activity-replies .action.likes");
				if(!actionLikes.length){
					setTimeout(smallAdder,200);
					return
				}
				actionLikes.forEach((node,index) => {
					if(node.querySelector(".count") && !(parseInt(node.querySelector(".count").innerText) <= 5)){
						node.title = data.data.Activity.replies[index].likes.map(like => like.name).join("\n")
					}
				});
			};
			if(data.data.Activity.replies.length){
				smallAdder()
			}
		}
		generalAPIcall(`
	query($id: Int){
		Activity(id: $id){
			... on TextActivity{
				likes{name}
				replies{likes{name}}
			}
			... on MessageActivity{
				likes{name}
				replies{likes{name}}
			}
			... on ListActivity{
				likes{name}
				replies{likes{name}}
			}
		}
	}`,
			{id: id},
			adder
		)
	}
})
//end modules/singleActivityReplyLikes.js
//begin modules/slimNav.js
exportModule({
	id: "slimNav",
	description: "$slimNav_description",
	isDefault: false,
	importance: -2,
	categories: ["Navigation"],
	visible: true
})
//end modules/slimNav.js
//begin modules/socialTab.js
//Morimasa code https://greasyfork.org/en/scripts/375622-betterfollowinglist
const stats = {
	element: null,
	count: 0,
	scoreSum: 0,
	scoreCount: 0
}

const scoreColors = e => {
	let el = e.querySelector("span") || e.querySelector("svg");
	let light = document.body.classList.contains("site-theme-dark") ? 45 : 38;
	if(!el){
		return null
	}
	el.classList.add("score");
	if(el.nodeName === "svg"){
		// smiley
		if(el.dataset.icon === "meh"){
			el.childNodes[0].setAttribute("fill",`hsl(60, 100%, ${light}%)`)
		}
		return {
			scoreCount: 0.5,//weight those scores lower because of the precision
			scoreSum: ({"smile": 85,"meh": 60,"frown": 35}[el.dataset.icon])*0.5
		}
	}
	else if(el.nodeName === "SPAN"){
		let score = el.innerText.split("/").map(num => parseFloat(num));
		if(score.length === 1){// convert stars, 10 point and 10 point decimal to 100 point
			score = score[0]*20-10
		}
		else{
			if(score[1] === 10){
				score = score[0]*10
			}
			else{
				score = score[0]
			}
		}
		el.style.color = `hsl(${score*1.2}, 100%, ${light}%)`;
		return {
			scoreCount: 1,
			scoreSum: score,
		}
	}
}

const handler = (data,target,idMap) => {
	if(!target){
		return
	}
	data.forEach(e => {
		target[idMap[e.user.id]].style.gridTemplateColumns = "30px 1.3fr .7fr .6fr .2fr .2fr .5fr"; //css is my passion
		const progress = create("div","progress",e.progress);
		if(e.media.chapters || e.media.episodes){
			progress.innerText = `${e.progress}/${e.media.chapters || e.media.episodes}`;
			if(e.progress > (e.media.chapters || e.media.episodes)){
				progress.title = translate("$socialTab_tooManyChapters")
			}
			else if(
				e.progress === (e.media.chapters || e.media.episodes)
				&& e.status === "COMPLETED"
			){
				progress.style.color = "rgb(var(--color-green))"
			}
		}
		target[idMap[e.user.id]].insertBefore(progress,target[idMap[e.user.id]].children[2])
		let notesEL = create("span","notes") // notes
		if(
			e.notes //only if notes
			&& !e.notes.match(/^,malSync::[a-zA-Z0-9]+=?=?::$/) //no need to show malSync-only notes, nobody is interested in that
			&& !e.notes.match(/^\s+$/) //whitespace-only notes will not show up properly anyway
			&& !e.notes.match(/^\$({.*})\$$/) //list JSON feature
		){
			if(e.notes.trim().match(/^(#\S+\s+)*(#\S+)$/)){//use a separate symbol for tags-only notes. Also helps popularizing tags
				notesEL.appendChild(svgAssets2.notesTags.cloneNode(true))
			}
			else{
				notesEL.appendChild(svgAssets2.notes.cloneNode(true))
			}
			notesEL.title = entityUnescape(e.notes);
		}
		let dateString;
		if(
			e.startedAt.year && e.completedAt.year && e.startedAt.year == e.completedAt.year
			&& e.startedAt.month && e.completedAt.month && e.startedAt.month == e.completedAt.month
			&& e.startedAt.day && e.completedAt.day && e.startedAt.day == e.completedAt.day
		){
			dateString = [
				e.startedAt.year,
				e.startedAt.month,
				e.startedAt.day
			].filter(TRUTHY).map(a => ((a + "").length === 1 ? "0" + a : "" + a)).join("-")
		}
		else{
			dateString = [
				e.startedAt.year,
				e.startedAt.month,
				e.startedAt.day
			].filter(TRUTHY).map(a => ((a + "").length === 1 ? "0" + a : "" + a)).join("-") + " - " + [
				e.completedAt.year,
				e.completedAt.month,
				e.completedAt.day
			].filter(TRUTHY).map(a => ((a + "").length === 1 ? "0" + a : "" + a)).join("-");
		}
		if(
			(e.media.chapters || e.media.episodes) === 1
			&& !e.startedAt.year
			&& e.completedAt.year
		){
			dateString = [
				e.completedAt.year,
				e.completedAt.month,
				e.completedAt.day
			].filter(TRUTHY).map(a => ((a + "").length === 1 ? "0" + a : "" + a)).join("-")
		}
		if(
			!e.completedAt.year
			&& e.createdAt
			&& e.status === "PLANNING"
		){
			dateString = translate("$mediaStatus_planning_time",new Date(e.createdAt*1000).toISOString().split("T")[0])
		}
		if(dateString !== " - "){
			target[idMap[e.user.id]].children[3].title = dateString;
		}
		if(useScripts.partialLocalisationLanguage !== "English"){
			let text = target[idMap[e.user.id]].children[3].childNodes[0].textContent;
			target[idMap[e.user.id]].children[3].childNodes[0].textContent = capitalize(translate("$mediaStatus_" + text.toLowerCase(),null,text))
		}
		target[idMap[e.user.id]].insertBefore(
			notesEL,target[idMap[e.user.id]].children[4]
		)
		let rewatchEL = create("span","repeat");
		if(e.repeat){
			rewatchEL.appendChild(svgAssets2.repeat.cloneNode(true));
			rewatchEL.title = e.repeat;
		}
		target[idMap[e.user.id]].insertBefore(
			rewatchEL,target[idMap[e.user.id]].children[4]
		)
	})
}

const MakeStats = () => {
	if(stats.element){
		stats.element.remove()
	}
	let main = create("h2");
	const createStat = (text, number) => {
		let el = create("span",false,text);
		create("span",false,number,el);
		return el
	}
	let count = createStat(translate("$socialTab_users") + ": ",stats.count);
	main.append(count);
	let avg = createStat(translate("$socialTab_shortAverage") + ": ",0);
	avg.style.float = "right";
	main.append(avg);
	const parent = document.querySelector(".following");
	parent.prepend(main);
	stats.element = main
}

function enhanceSocialTab(){
	if(!location.pathname.match(/^\/(anime|manga)\/\d*(\/[\w-]*)?\/social/)){
		return
	}
	let listOfFollowers = Array.from(document.getElementsByClassName("follow"));
	listOfFollowers = listOfFollowers.filter((ele,index) => {
		if(index && listOfFollowers[index - 1].href === ele.href){
			ele.remove();
			return false
		}
		return true
	})
	if(!listOfFollowers.length){
		setTimeout(enhanceSocialTab,100);
		return
	}
	MakeStats();
	let idmap = {};//TODO, rewrite as actual map?
	listOfFollowers.forEach(function(e,i){
		if(!e.dataset.changed){
			const avatarURL = e.querySelector(".avatar").dataset.src;
			if(!avatarURL || avatarURL === "https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png"){
				return
			}
			const id = avatarURL.split("/").pop().match(/\d+/g)[0];
			idmap[id] = i;
			let change = scoreColors(e);
			if(change){
				stats.scoreCount += change.scoreCount;
				stats.scoreSum += change.scoreSum
			}
			++stats.count;
			e.dataset.changed = true
		}
	})
	if(Object.keys(idmap).length){
		const mediaID = window.location.pathname.split("/")[2];
		generalAPIcall(
			`query($users:[Int],$media:Int){
				Page{
					mediaList(userId_in: $users,mediaId: $media){
						progress notes repeat user{id}
						startedAt{year month day}
						completedAt{year month day}
						createdAt
						status
						media{chapters episodes}
					}
				}
			}`,
			{users: Object.keys(idmap), media: mediaID},
			function(res){
				let unique = new Map();
				res.data.Page.mediaList.forEach(media => {
					unique.set(media.user.id,media)
				})
				handler(
					Array.from(unique).map(e => e[1]),
					listOfFollowers,
					idmap
				)
			}
		)
		let statsElements = stats.element.querySelectorAll("span > span");
		statsElements[0].innerText = stats.count;
		const avgScore = Math.round(stats.scoreSum/stats.scoreCount || 0);
		if(avgScore){
			statsElements[1].style.color = `hsl(${avgScore*1.2}, 100%, 40%)`;
			statsElements[1].innerText = `${avgScore}%`;
			statsElements[1].title = (stats.scoreSum/stats.scoreCount).toPrecision(4)
		}
		else{
			statsElements[1].parentNode.remove() // no need if no scores
		}
		statsElements[1].onclick = function(){
			statsElements[1].classList.toggle("toggled");
			Array.from(root.querySelectorAll(".follow")).forEach(function(item){
				if(item.querySelector(".score") || !statsElements[1].classList.contains("toggled")){
					item.style.display = "grid"
				}
				else{
					item.style.display = "none"
				}
			})
		}
	}
/*add average score to social tab*/
	let root = listOfFollowers[0].parentNode;
	let distribution = {};
	Object.keys(distributionColours).forEach(
		status => distribution[status] = 0
	);
	listOfFollowers.forEach(function(follower){
		let statusType = follower.querySelector(".status").innerText.toUpperCase();
		if(statusType === "WATCHING" || statusType === "READING"){
			statusType = "CURRENT"
		}
		distribution[statusType]++
	});
	if(
		Object.keys(distributionColours).some(status => distribution[status] > 0)
	){
		let locationForIt = document.getElementById("averageScore");
		let dataList = document.getElementById("socialUsers");
		let statusList = document.getElementById("statusList");
		if(!locationForIt){
			let insertLocation = document.querySelector(".following");
			insertLocation.parentNode.style.marginTop = "5px";
			insertLocation.parentNode.style.position = "relative";
			locationForIt = create("span","#averageScore");
			insertLocation.insertBefore(
				locationForIt,
				insertLocation.children[0]
			);
			statusList = create("span","#statusList",false,false,"position:absolute;right:0px;top:5px;");
			insertLocation.insertBefore(
				statusList,
				insertLocation.children[0]
			);
			dataList = create("datalist","#socialUsers");
			insertLocation.insertBefore(
				dataList,
				insertLocation.children[0]
			);
			if(insertLocation.parentNode.children[0].nodeName === "H2"){
				insertLocation.parentNode.children[0].classList.remove("link");
				insertLocation.parentNode.children[0].classList.remove("router-link-exact-active");
				insertLocation.parentNode.children[0].classList.remove("router-link-active")
			}
		}
		locationForIt.nextSibling.style.marginTop = "5px";
		if(dataList.childElementCount < listOfFollowers.length){
			listOfFollowers.slice(dataList.childElementCount).forEach(
				follower => create("option",false,false,dataList)
					.value = follower.children[1].innerText
			)
		}
		removeChildren(statusList);
		let sortStatus = "";
		semmanticStatusOrder.forEach(status => {
			if(distribution[status]){
				let statusSumDot = create("div","hohSummableStatus",distribution[status],statusList);
				statusSumDot.style.background = distributionColours[status];
				statusSumDot.title = distribution[status] + " " + capitalize(translate("$mediaStatus_" + status.toLowerCase()));
				if(distribution[status] > 99){
					statusSumDot.style.fontSize = "8px"
				}
				if(distribution[status] > 999){
					statusSumDot.style.fontSize = "6px"
				}
				statusSumDot.onclick = function(){
					if(sortStatus === status){
						Array.from(root.querySelectorAll(".follow .status")).forEach(item => {
							item.parentNode.style.display = "grid"
						})
						sortStatus = ""
					}
					else{
						Array.from(root.querySelectorAll(".follow .status")).forEach(item => {
							if(item.innerText.toUpperCase() === status || (["WATCHING","READING"].includes(item.innerText.toUpperCase()) && status === "CURRENT")){
								item.parentNode.style.display = "grid"
							}
							else{
								item.parentNode.style.display = "none"
							}
						})
						sortStatus = status
					}
				}
			}
		});
	}
	let waiter = function(){
		setTimeout(function(){
			if(root.childElementCount !== listOfFollowers.length){
				enhanceSocialTab()
			}
			else{
				waiter()
			}
		},100);
	};waiter()
}
//end modules/socialTab.js
//begin modules/socialTabFeed.js
function enhanceSocialTabFeed(){
	let URLstuff = location.pathname.match(/^\/(anime|manga)\/(\d+)(\/[\w-]*)?\/social/);
	if(!URLstuff){
		return
	}
	let feedLocation = document.querySelector(".activity-feed");
	if(!feedLocation){
		setTimeout(enhanceSocialTabFeed,100);
		return
	}
	let hohFeed = create("div","hohSocialFeed");
	feedLocation.insertBefore(hohFeed,feedLocation.children[0]);
	let optionsContainer = create("div",false,false,hohFeed,"position:absolute;top:0px;right:0px;");
	let hasReplies = createCheckbox(optionsContainer);
	create("span",false,translate("$filter_replies"),optionsContainer,"margin-right:7px;");
	let isFollowing = createCheckbox(optionsContainer);
	if(useScripts.accessToken){
		create("span",false,translate("$filter_following"),optionsContainer)
	}
	else{
		isFollowing.parentNode.style.display = "none"
	}
	let feedHeader = create("h2",false,translate("$feedHeader"),hohFeed,"display:none;");
	let feedContent = create("div",false,false,hohFeed,"display:none;");
	let loadMore = create("div","load-more",translate("$load_more"),hohFeed);
	let query = "";
	let buildFeed = function(page){
		authAPIcall(//use also when accessToken is not available, since it will fall back to a regular API call
			query,
			{
				page: page,
				mediaId: parseInt(URLstuff[2])
			},
			function(data){
				if(!data){//restore regular feed
					feedLocation.classList.remove("hohReplaceFeed");
					feedContent.style.display = "none";
					feedHeader.style.display = "none";
					loadMore.style.display = "none";
					return
				}
				if(
					data.data.Page.pageInfo.lastPage > page
					&& (
						data.data.Page.activities.length === 25
						|| data.data.Page.activities.length === 24//since pageInfo is kill, it's better with some false positives than missing the button too often
					)
				){
					loadMore.style.display = "block";
					loadMore.onclick = function(){
						buildFeed(page + 1)
					}
				}
				else{
					loadMore.style.display = "none"
				}
				if(data.data.Page.activities.length === 0){
					create("div","activity-entry",translate("$socialTabFeed_noActivities"),feedContent)
				}
				data.data.Page.activities.forEach(act => {
					let activityEntry = create("div",["activity-entry","activity-" + URLstuff[1] + "_list"],false,feedContent);
					let wrap = create("div","wrap",false,activityEntry);
						let list = create("div","list",false,wrap);
							let cover = create("a",["cover","router-link-active"],false,list);
							cover.href = "/" + URLstuff[1] + "/" + URLstuff[2] + "/" + safeURL(act.media.title.userPreferred);
							cover.style.backgroundImage = `url("${act.media.coverImage.medium}")`;
							let details = create("div","details",false,list);
								let name = create("a","name",act.user.name,details);
								name.href = "/user/" + act.user.name;
								details.appendChild(document.createTextNode(" "));
								if(!act.status){//old "null" values from the API
									if(URLstuff[1] === "manga"){
										act.status = "read"
									}
									else{
										act.status = "watched"
									}
								}
								let status = create("div","status",act.status + (act.progress ? " " + act.progress + " of " : " "),details);
								if(URLstuff[1] === "manga"){
									if(act.status === "read chapter" && act.progress){
										status.innerText = translate("$listActivity_MreadChapter",act.progress)
									}
									else if(act.status === "reread"){
										status.innerText = translate("$listActivity_repeatedManga")
									}
									else if(act.status === "reread chapter" && act.progress){
										status.innerText = translate("$listActivity_MrepeatingManga",act.progress)
									}
									else if(act.status === "dropped" && act.progress){
										status.innerText = " " + translate("$listActivity_MdroppedManga",act.progress)
									}
									else if(act.status === "completed"){
										status.innerText = translate("$listActivity_completedManga")
									}
									else if(act.status === "plans to read"){
										status.innerText = translate("$listActivity_planningManga")
									}
									else if(act.status === "paused reading"){
										status.innerText = translate("$listActivity_pausedManga")
									}
									else{
										console.warn("Missing listActivity translation key for:",act.status)
									}
								}
								else{
									if(act.status === "watched episode" && act.progress){
										status.innerText = translate("$listActivity_MwatchedEpisode",act.progress)
									}
									else if(act.status === "rewatched"){
										status.innerText = translate("$listActivity_repeatedAnime")
									}
									else if(act.status === "rewatched episode" && act.progress){
										status.innerText = translate("$listActivity_MrepeatingAnime",act.progress)
									}
									else if(act.status === "dropped" && act.progress){
										status.innerText = " " + translate("$listActivity_MdroppedAnime",act.progress)
									}
									else if(act.status === "completed"){
										status.innerText = translate("$listActivity_completedAnime")
									}
									else if(act.status === "plans to watch"){
										status.innerText = translate("$listActivity_planningAnime")
									}
									else if(act.status === "paused watching"){
										status.innerText = translate("$listActivity_pausedAnime")
									}
									else{
										console.warn("Missing listActivity translation key for:",act.status)
									}
								}
								let link = create("a",["title","router-link-active"]," " + act.media.title.userPreferred,status);
									link.href = "/" + URLstuff[1] + "/" + URLstuff[2] + "/" + safeURL(act.media.title.userPreferred);
								let avatar = create("a","avatar",false,details);
								avatar.href = "/user/" + act.user.name;
								avatar.style.backgroundImage = `url("${act.user.avatar.medium}")`;
						let timeWrapper = create("div","time",false,wrap);
							let action = create("a","action",false,timeWrapper);
							action.appendChild(svgAssets2.link.cloneNode(true));
							action.href = "/activity/" + act.id;
							cheapReload(action,{name: "Activity", params: {id: act.id}});
							let time = nativeTimeElement(act.createdAt);timeWrapper.appendChild(time);
						let actions = create("div","actions",false,wrap);
							let actionReplies = create("div",["action","replies"],false,actions);
								if(act.replies.length){
									let replyCount = create("span","count",act.replies.length,actionReplies);
									actionReplies.appendChild(document.createTextNode(" "));
								}
								actionReplies.appendChild(svgAssets2.reply.cloneNode(true));
							actions.appendChild(document.createTextNode(" "));
							let actionLikes = create("div",["action","likes"],false,actions);
								let likeWrap = create("div","like-wrap",false,actionLikes);
									let likeButton = create("div","button",false,likeWrap);
										let likeCount = create("span","count",act.likes.length || "",likeButton);
										likeButton.appendChild(document.createTextNode(" "));
										likeButton.appendChild(svgAssets2.likeNative.cloneNode(true));
									likeButton.title = act.likes.map(a => a.name).join("\n");
									if(act.likes.some(like => like.name === whoAmI)){
										likeButton.classList.add("liked")
									}
									likeButton.onclick = function(){
										authAPIcall(
											"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY){id}}",
											{id: act.id},
											function(data2){
												if(!data2){
													authAPIcall(//try again once if it fails
														"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY){id}}",
														{id: act.id},
														function(data3){}
													)
												}
											}
										);
										if(act.likes.some(like => like.name === whoAmI)){
											act.likes.splice(act.likes.findIndex(user => user.name === whoAmI),1);
											likeButton.classList.remove("liked");
											if(act.likes.length > 0){
												likeButton.querySelector(".count").innerText = act.likes.length
											}
											else{
												likeButton.querySelector(".count").innerText = ""
											}
										}
										else{
											act.likes.push({name: whoAmI});
											likeButton.classList.add("liked");
											likeButton.querySelector(".count").innerText = act.likes.length;
										}
										likeButton.title = act.likes.map(a => a.name).join("\n")
									};
					let replyWrap = create("div","reply-wrap",false,activityEntry,"display:none;");
					actionReplies.onclick = function(){
						if(replyWrap.style.display === "none"){
							replyWrap.style.display = "block"
						}
						else{
							replyWrap.style.display = "none"
						}
					};
					let activityReplies = create("div","activity-replies",false,replyWrap);
					act.replies.forEach(rep => {
						let reply = create("div","reply",false,activityReplies);
							let header = create("div","header",false,reply);
								let repAvatar = create("a","avatar",false,header);
								repAvatar.href = "/user/" + rep.user.name;
								repAvatar.style.backgroundImage = `url("${rep.user.avatar.medium}")`;
								header.appendChild(document.createTextNode(" "));
								let repName = create("a","name",rep.user.name,header);
								repName.href = "/user/" + rep.user.name;
								let cornerWrapper = create("div","actions",false,header);
									let repActionLikes = create("div",["action","likes"],false,cornerWrapper,"display: inline-block");
										const randomDataHate = "data-v-977827fa";
										let repLikeWrap = create("div","like-wrap",false,repActionLikes);
											let repLikeButton = create("div","button",false,repLikeWrap);
												let repLikeCount = create("span","count",rep.likes.length || "",repLikeButton);
												repLikeButton.appendChild(document.createTextNode(" "));
												repLikeButton.appendChild(svgAssets2.likeNative.cloneNode(true));
											repLikeButton.title = rep.likes.map(a => a.name).join("\n");
											if(rep.likes.some(like => like.name === whoAmI)){
												repLikeButton.classList.add("liked")
											}
											repLikeButton.onclick = function(){
												authAPIcall(
													"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
													{id: rep.id},
													function(data2){
														if(!data2){
															authAPIcall(//try again once if it fails
																"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
																{id: rep.id},
																function(data3){}
															)
														}
													}
												);
												if(rep.likes.some(like => like.name === whoAmI)){
													rep.likes.splice(rep.likes.findIndex(user => user.name === whoAmI),1);
													repLikeButton.classList.remove("liked");
													repLikeButton.classList.remove("hohILikeThis");
													if(rep.likes.length > 0){
														repLikeButton.querySelector(".count").innerText = rep.likes.length
													}
													else{
														repLikeButton.querySelector(".count").innerText = ""
													}
												}
												else{
													rep.likes.push({name: whoAmI});
													repLikeButton.classList.add("liked");
													repLikeButton.classList.add("hohILikeThis");
													repLikeButton.querySelector(".count").innerText = rep.likes.length;
												}
												repLikeButton.title = rep.likes.map(a => a.name).join("\n")
											};
									let repActionTime = create("div",["action","time"],false,cornerWrapper,"display: inline-block");
										let repTime = nativeTimeElement(rep.createdAt);repActionTime.appendChild(repTime);
							let replyMarkdown = create("div","reply-markdown",false,reply);
								let markdown = create("div","markdown",false,replyMarkdown);
								markdown.innerHTML = rep.text;//reason for inner HTML: preparsed sanitized HTML from the Anilist API
					})
				})
			}
		)
	};
	hasReplies.oninput = isFollowing.oninput = function(){
		if(hasReplies.checked || isFollowing.checked){
			feedLocation.classList.add("hohReplaceFeed");
			feedContent.style.display = "block";
			feedHeader.style.display = "block";
			removeChildren(feedContent)
			if(hasReplies.checked && isFollowing.checked){
				query = `
query($mediaId: Int,$page: Int){
	Page(page: $page,perPage: 25){
		pageInfo{lastPage}
		activities(mediaId: $mediaId,hasReplies:true,isFollowing:true,sort:ID_DESC){
			... on ListActivity{
				id
				status
				progress
				createdAt
				user{
					name
					avatar{
						medium
					}
				}
				media{
					title{
						userPreferred
					}
					coverImage{medium}
				}
				replies{
					id
					text(asHtml: true)
					createdAt
					user{
						name
						avatar{
							medium
						}
					}
					likes{
						name
					}
				}
				likes{
					name
				}
			}
		}
	}
}`;
			}
			else if(hasReplies.checked){
				query = `
query($mediaId: Int,$page: Int){
	Page(page: $page,perPage: 25){
		pageInfo{lastPage}
		activities(mediaId: $mediaId,hasReplies:true,sort:ID_DESC){
			... on ListActivity{
				id
				status
				progress
				createdAt
				user{
					name
					avatar{
						medium
					}
				}
				media{
					title{
						userPreferred
					}
					coverImage{medium}
				}
				replies{
					id
					text(asHtml: true)
					createdAt
					user{
						name
						avatar{
							medium
						}
					}
					likes{
						name
					}
				}
				likes{
					name
				}
			}
		}
	}
}`;
			}
			else{
				query = `
query($mediaId: Int,$page: Int){
	Page(page: $page,perPage: 25){
		pageInfo{lastPage}
		activities(mediaId: $mediaId,isFollowing:true,sort:ID_DESC){
			... on ListActivity{
				id
				status
				progress
				createdAt
				user{
					name
					avatar{
						medium
					}
				}
				media{
					title{
						userPreferred
					}
					coverImage{medium}
				}
				replies{
					id
					text(asHtml: true)
					createdAt
					user{
						name
						avatar{
							medium
						}
					}
					likes{
						name
					}
				}
				likes{
					name
				}
			}
		}
	}
}`;
			}
			buildFeed(1)
		}
		else{
			feedLocation.classList.remove("hohReplaceFeed");
			feedContent.style.display = "none";
			feedHeader .style.display = "none";
			loadMore   .style.display = "none"
		}
	}
}
//end modules/socialTabFeed.js
//begin modules/staff.js
function enhanceStaff(){
	if(!document.URL.match(/^https:\/\/anilist\.co\/staff\/.*/)){
		return
	}
	if(document.querySelector(".hohFavCount")){
		return
	}
	const variables = {id: document.URL.match(/\/staff\/(\d+)\/?/)[1]};
	const query = "query($id: Int!){Staff(id: $id){favourites}}";
	let favCallback = function(data){
		if(!document.URL.match(/^https:\/\/anilist\.co\/staff\/.*/)){
			return
		}
		let favCount = document.querySelector(".favourite .count");
		if(favCount){
			favCount.parentNode.onclick = function(){
				if(favCount.parentNode.classList.contains("isFavourite")){
					favCount.innerText = Math.max(parseInt(favCount.innerText) - 1,0)//0 or above, just to avoid looking silly
				}
				else{
					favCount.innerText = parseInt(favCount.innerText) + 1
				}
			};
			if(data.data.Staff.favourites === 0 && favCount[0].classList.contains("isFavourite")){//safe to assume
				favCount.innerText = data.data.Staff.favourites + 1
			}
			else{
				favCount.innerText = data.data.Staff.favourites
			}
		}
		else{
			setTimeout(function(){favCallback(data)},200)
		}
	};
	generalAPIcall(query,variables,favCallback,"hohStaffFavs" + variables.id,60*60*1000)
}
//end modules/staff.js
//begin modules/staffBrowse.js
function enhanceStaffBrowse(){
	if(!document.URL.match(/\/search\/staff\/?(favorites)?$/)){
		return
	}
	const query = `
query($page: Int!){
	Page(page: $page,perPage: 30){
		staff(sort: [FAVOURITES_DESC]){
			id
			favourites
			anime:staffMedia(type:ANIME){
				pageInfo{
					total
				}
			}
			manga:staffMedia(type:MANGA){
				pageInfo{
					total
				}
			}
			characters{
				pageInfo{
					total
				}
			}
		}
	}
}`;
	let favCallback = function(data,page){
		if(!document.URL.match(/\/search\/staff\/?(favorites)?$/)){
			return
		}
		let resultsToTag = document.querySelectorAll(".results.cover .staff-card,.landing-section.staff .staff-card");
		if(resultsToTag.length < page*data.data.Page.staff.length){
			setTimeout(function(){
				favCallback(data,page)
			},200);//may take some time to load
			return
		}
		data = data.data.Page.staff;
		data.forEach(function(staff,index){
			create("span","hohFavCountBrowse",staff.favourites,resultsToTag[(page - 1)*data.length + index]).title = "Favourites";
			if(staff.anime.pageInfo.total + staff.manga.pageInfo.total > staff.characters.pageInfo.total){
				let roleLine = create("div","hohRoleLine",false,resultsToTag[(page - 1)*data.length + index]);
				roleLine.style.backgroundImage =
				"linear-gradient(to right,hsla(" + Math.round(
					120*(1 + staff.anime.pageInfo.total/(staff.anime.pageInfo.total + staff.manga.pageInfo.total))
				) + ",100%,50%,0.8),rgba(var(--color-overlay),0.8))";
				let animePercentage = Math.round(100*staff.anime.pageInfo.total/(staff.anime.pageInfo.total + staff.manga.pageInfo.total));
				if(animePercentage === 100){
					roleLine.title = "100% anime"
				}
				else if(animePercentage === 0){
					roleLine.title = "100% manga"
				}
				else if(animePercentage >= 50){
					roleLine.title = animePercentage + "% anime, " + (100 - animePercentage) + "% manga"
				}
				else{
					roleLine.title = (100 - animePercentage) + "% manga, " + animePercentage + "% anime"
				}
			}
		});
		generalAPIcall(query,{page:page+1},data => favCallback(data,page+1))
	};
	generalAPIcall(query,{page:1},data => favCallback(data,1))
}
//end modules/staffBrowse.js
//begin modules/studio.js
function enhanceStudio(){//adds a favourite count to every studio page
	if(!location.pathname.match(/^\/studio(\/.*)?/)){
		return
	}
	let filterGroup = document.querySelector(".container.header");
	if(!filterGroup){
		setTimeout(enhanceStudio,200);//may take some time to load
		return;
	}
	let favCallback = function(data){
		if(!document.URL.match(/^https:\/\/anilist\.co\/studio\/.*/)){
			return
		}
		let favCount = document.querySelector(".favourite .count");
		if(favCount){
			favCount.parentNode.onclick = function(){
				if(favCount.parentNode.classList.contains("isFavourite")){
					favCount.innerText = Math.max(parseInt(favCount.innerText) - 1,0)//0 or above, just to avoid looking silly
				}
				else{
					favCount.innerText = parseInt(favCount.innerText) + 1
				}
			};
			if(data.data.Studio.favourites === 0 && favCount[0].classList.contains("isFavourite")){//safe to assume
				favCount.innerText = data.data.Studio.favourites + 1
			}
			else{
				favCount.innerText = data.data.Studio.favourites
			}
		}
		else{
			setTimeout(function(){favCallback(data)},200);
		}
	};
	const variables = {id: location.pathname.match(/\/studio\/(\d+)\/?/)[1]};
	generalAPIcall(
		`
query($id: Int!){
	Studio(id: $id){
		favourites
	}
}`,
		variables,favCallback,"hohStudioFavs" + variables.id,60*60*1000
	);
}
//end modules/studio.js
//begin modules/submenu.js
if(useScripts.CSSverticalNav && whoAmI && !useScripts.mobileFriendly){
	let addMouseover = function(){
		let navThingy = document.querySelector(`.nav .links .link[href^="/user/"]`);
		if(navThingy){
			navThingy.style.position = "relative";
			let hackContainer = create("div","subMenuContainer",false,false,"position:relative;width:100%;min-height:50px;z-index:134;display:inline-flex;");
			navThingy.parentNode.insertBefore(hackContainer,navThingy);
			hackContainer.appendChild(navThingy);
			let subMenu = create("div","hohSubMenu",false,hackContainer);
			let linkStats = create("a","hohSubMenuLink",translate("$submenu_stats"),subMenu);
			if(useScripts.mangaBrowse){
				linkStats.href = "/user/" + whoAmI + "/stats/manga/overview";
				cheapReload(linkStats,{path: "/user/" + whoAmI + "/stats/manga/overview"});
			}
			else{
				linkStats.href = "/user/" + whoAmI + "/stats/anime/overview";
				cheapReload(linkStats,{path: "/user/" + whoAmI + "/stats/anime/overview"});
			}
			[
				{
					text: "$submenu_social",
					href: "/user/" + whoAmI + "/social",
					vue: {path: "/user/" + whoAmI + "/social"}
				},
				{
					text: "$submenu_reviews",
					href: "/user/" + whoAmI + "/reviews",
					vue: {path: "/user/" + whoAmI + "/reviews"}
				},
				{
					text: "$submenu_favourites",
					href: "/user/" + whoAmI + "/favorites",
					vue: {path: "/user/" + whoAmI + "/favorites"}
				},
				{
					text: "$submenu_submissions",
					href: "/user/" + whoAmI + "/submissions",
					vue: {path: "/user/" + whoAmI + "/submissions"}
				}
			].forEach(link => {
				let element = create("a","hohSubMenuLink",translate(link.text),subMenu);
				element.href = link.href;
				if(link.vue){
					cheapReload(element,link.vue)
				}
			})
			hackContainer.onmouseenter = function(){
				subMenu.style.display = "inline"
			}
			hackContainer.onmouseleave = function(){
				subMenu.style.display = "none"
			}
		}
		else{
			setTimeout(addMouseover,500)
		}
	};addMouseover()
}
//end modules/submenu.js
//begin modules/termsFeed.js
exportModule({
	id: "termsFeed",
	description: "$terms_description",
	extendedDescription: `
Creates a new home page at the URL https://anilist.co/terms.

Why?
To give you an alternative if you have a crappy internet connection.
The Anilist UI is several megabytes, and also has plenty of images to load.
By contrast, this alternative feed only needs a couple of kilobytes to load.

In order to create status updates, post comments and like activities, you will have to SIGN IN (see bottom of the settings page).

If you use this feed, you may also be interested in the "Do not load images on the low bandwidth feed" setting.
	`,
	isDefault: true,
	importance: 5,
	categories: ["Feeds","Login"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return /^https:\/\/anilist\.co\/terms/.test(url)
	},
	code: function(){
let page = 1;
let searchParams = new URLSearchParams(location.search);
if(searchParams.get("page")){
	page = parseInt(searchParams.get("page"))
}
let date = searchParams.get("date");
let pageLocation = document.querySelector(".container");
pageLocation.parentNode.style.background = "rgb(39,44,56)";
pageLocation.parentNode.style.color = "rgb(159,173,189)";
let terms = create("div",["container","termsFeed"],false,pageLocation.parentNode,"max-width: 1100px;margin-left:170px;margin-right:170px;");
pageLocation.style.display = "none";
let policy = create("button",["hohButton","button"],translate("$terms_privacyPolicy"),terms,"font-size:1rem;color:initial;padding:3px;");
policy.title = translate("$terms_privacyPolicy_title");
policy.onclick = function(){
	pageLocation.style.display = "initial";
	terms.style.display = "none";
	document.title = "Anilist Terms"
};
if(!useScripts.accessToken){
	create("p",false,translate("$terms_signin"),terms);
	let loginURL = create("a",false,translate("$terms_signin_link"),terms);
	loginURL.href = authUrl;
	loginURL.style.color = "rgb(61,180,242)";
	return
}
document.title = "Anilist Feed";
let browseSettings = create("div",false,false,terms,"margin-top:10px;");
let onlyGlobal = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_global"),browseSettings,"margin-right:5px;");
let onlyStatus = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_text"),browseSettings,"margin-right:5px;");
let onlyReplies = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_replies"),browseSettings,"margin-right:5px;");
let onlyForum = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_forum"),browseSettings,"margin-right:5px;");
let onlyReviews = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_reviews"),browseSettings);
create("br",false,false,browseSettings);
create("br",false,false,browseSettings);
let onlyUser = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_user"),browseSettings,"margin-right:5px;");
let onlyUserInput = create("input",false,false,browseSettings,"background:rgb(31,35,45);border-width:0px;margin-left:20px;border-radius:3px;color:rgb(159,173,189);margin-right: 10px;padding:3px;");
let onlyMedia = createCheckbox(browseSettings);
create("span",false,translate("$terms_option_media"),browseSettings,"margin-right:5px;");
let onlyMediaResult = {id: 0,type: "ANIME"};
let onlyMediaInput = create("input",false,false,browseSettings,"background:rgb(31,35,45);border-width:0px;margin-left:20px;border-radius:3px;color:rgb(159,173,189);margin-right: 10px;padding:3px;");
let mediaDisplayResults = create("div",false,false,browseSettings,"margin-top:5px;");
let dataUsers = new Set([whoAmI]);
let dataMedia = new Set();
let dataUsersList = create("datalist","#userDatalist",false,browseSettings);
let dataMediaList = create("datalist","#userMedialist",false,browseSettings);
let onlyActivity = null;
onlyUserInput.setAttribute("list","userDatalist");
if(searchParams.get("user")){
	onlyUserInput.value = decodeURIComponent(searchParams.get("user"));
	onlyUser.checked = true
}
if(searchParams.get("activity")){
	onlyActivity = parseInt(searchParams.get("activity"))
}
onlyMediaInput.setAttribute("list","userMedialist");
let feed = create("div","hohFeed",false,terms);
let topNav = create("div",false,false,feed,"position:relative;min-height:60px;margin-bottom:15px;");
let loading = create("p",false,translate("$loading"),topNav);
let pageCount = create("p",false,translate("$page",1),topNav);
let statusInput = create("div",false,false,topNav);
let onlySpecificActivity = false;
let statusInputTitle = create("input",false,false,statusInput,"display:none;border-width: 1px;padding: 4px;border-radius: 2px;color: rgb(159, 173, 189);background: rgb(var(--color-foreground));");
statusInputTitle.placeholder = "Title";
let inputArea = create("textarea",false,false,statusInput,"width: 99%;border-width: 1px;padding: 4px;border-radius: 2px;color: rgb(159, 173, 189);resize: vertical;");
inputArea.rows = 3;
inputArea.placeholder = translate("$placeholder_status");
create("br",false,false,statusInput);
let cancelButton = create("button",["hohButton","button"],translate("$button_cancel"),statusInput,"background:rgb(31,35,45);display:none;color: rgb(159, 173, 189);");
let publishButton = create("button",["hohButton","button"],translate("$button_publish"),statusInput,"display:none;");
let previewArea = create("div",false,false,statusInput,"display:none;");
let topPrevious = create("button",["hohButton","button"],translate("$button_refresh"),topNav,"position:fixed;top:120px;left:calc(5% - 50px);z-index:50;");
let topNext = create("button",["hohButton","button"],translate("$button_next"),topNav,"position:fixed;top:120px;right:calc(5% - 50px);z-index:50;");
let feedContent = create("div",false,false,feed);
let notiLink = create("a",["link"],"",topNav,"position:fixed;top:10px;right:10px;color:rgb(var(--color-blue));text-decoration:none;background:rgb(var(--color-red));border-radius: 10px;min-width: 20px;text-align: center;color:white;cursor: pointer;");
let lastUpdated = 0;
let changeURL = function(){
	const baseState = location.protocol + "//" + location.host + location.pathname;
	let params = [];
	if(page !== 1){
		params.push("page=" + page)
	}
	if(onlyUser.checked && onlyUserInput.value.length){
		params.push("user=" + encodeURIComponent(onlyUserInput.value))
	}
	if(date){
		params.push("date=" + date)
	}
	if(params.length){
		params = "?" + params.join("&")
	}
	current = baseState + params;
	history.replaceState({},"",baseState + params)
};
let handleNotifications = function(data){
	if(data.data.Viewer){
		notiLink.innerText = data.data.Viewer.unreadNotificationCount;
		if(data.data.Viewer.unreadNotificationCount === 1){
			notiLink.title = "1 unread notification"
		}
		else if(data.data.Viewer.unreadNotificationCount){
			notiLink.title = data.data.Viewer.unreadNotificationCount + " unread notifications"
		}
		else{
			notiLink.title = "no unread notifications"
		}
	}
}
let likeify = function(likes,likeQuickView){
	likes.forEach(like => {
		dataUsers.add(like.name)
	})
	removeChildren(likeQuickView)
	if(likes.length === 0){ /*do nothing*/ }
	else if(likes.length === 1){
		create("span",false,likes[0].name,likeQuickView,`color: hsl(${Math.abs(hashCode(likes[0].name)) % 360},50%,50%)`)
	}
	else if(likes.length === 2){
		let name1 = create("span",false,likes[0].name.slice(0,(likes[0].name.length <= 6 ? likes[0].name.length : 4)),likeQuickView,`color: hsl(${Math.abs(hashCode(likes[0].name)) % 360},50%,50%)`);
		create("span",false," & ",likeQuickView);
		let name2 = create("span",false,likes[1].name.slice(0,(likes[1].name.length <= 6 ? likes[1].name.length : 4)),likeQuickView,`color: hsl(${Math.abs(hashCode(likes[1].name)) % 360},50%,50%)`);
		name1.onmouseover = function(){
			name1.innerText = likes[0].name
		}
		name2.onmouseover = function(){
			name2.innerText = likes[1].name
		}
	}
	else if(likes.length === 3){
		let name1 = create("span",false,likes[0].name.slice(0,(likes[0].name.length <= 5 ? likes[0].name.length : 3)),likeQuickView,`color: hsl(${Math.abs(hashCode(likes[0].name)) % 360},50%,50%)`);
		create("span",false,", ",likeQuickView);
		let name2 = create("span",false,likes[1].name.slice(0,(likes[1].name.length <= 5 ? likes[1].name.length : 3)),likeQuickView,`color: hsl(${Math.abs(hashCode(likes[1].name)) % 360},50%,50%)`);
		create("span",false," & ",likeQuickView);
		let name3 = create("span",false,likes[2].name.slice(0,(likes[2].name.length <= 5 ? likes[1].name.length : 3)),likeQuickView,`color: hsl(${Math.abs(hashCode(likes[2].name)) % 360},50%,50%)`);
		name1.onmouseover = function(){
			name1.innerText = likes[0].name
		}
		name2.onmouseover = function(){
			name2.innerText = likes[1].name
		}
		name3.onmouseover = function(){
			name3.innerText = likes[2].name
		}
	}
	else if(likes.length === 4){
		likes.forEach(like => {
			let name = create("span",false,like.name.slice(0,(like.name.length <= 3 ? like.name.length : 2)),likeQuickView,`color: hsl(${Math.abs(hashCode(like.name)) % 360},50%,50%)`);
			create("span",false,", ",likeQuickView);
			name.onmouseover = function(){
				name.innerText = like.name
			}
		});
		likeQuickView.lastChild.remove()
	}
	else if(likes.length === 5 || likes.length === 6){
		likes.forEach(like => {
			let name = create("span",false,like.name.slice(0,2),likeQuickView,`color: hsl(${Math.abs(hashCode(like.name)) % 360},50%,50%)`);
			create("span",false," ",likeQuickView);
			name.onmouseover = function(){
				name.innerText = like.name
			}
			name.onmouseout = function(){
				name.innerText = like.name.slice(0,2)
			}
		});
		likeQuickView.lastChild.remove()
	}
	else if(likes.length < 12){
		likes.forEach(like => {
			let name = create("span",false,like.name[0],likeQuickView,`color: hsl(${Math.abs(hashCode(like.name)) % 360},50%,50%)`);
			create("span",false," ",likeQuickView);
			name.onmouseover = function(){
				name.innerText = like.name
			}
			name.onmouseout = function(){
				name.innerText = like.name[0]
			}
		});
		likeQuickView.lastChild.remove()
	}
	else if(likes.length <= 20){
		likes.forEach(like => {
			let name = create("span",false,like.name[0],likeQuickView,`color: hsl(${Math.abs(hashCode(like.name)) % 360},50%,50%)`);
			name.onmouseover = function(){
				name.innerText = " " + like.name + " "
			}
			name.onmouseout = function(){
				name.innerText = like.name[0]
			}
		})
	}
}
let viewSingleActivity = function(id){
	loading.innerText = translate("$loading");
	authAPIcall(
`query($id: Int){
	Activity(id: $id){
		... on TextActivity{
			id
			type
			createdAt
			text
			user{name}
			likes{name}
			replies{
				id
				createdAt
				text
				user{name}
				likes{name}
			}
		}
		... on MessageActivity{
			id
			type
			createdAt
			text: message
			user: messenger{name}
			recipient{name}
			likes{name}
			replies{
				id
				createdAt
				text
				user{name}
				likes{name}
			}
		}
		... on ListActivity{
			id
			type
			createdAt
			user{name}
			likes{name}
			media{type id title{romaji}}
			progress
			status
			replies{
				id
				createdAt
				text
				user{name}
				likes{name}
			}
		}
	}
}`,
		{id: id},
		function(data){
			loading.innerText = "";
			if(!data){
				loading.innerText = translate("$error_connection");
				return
			}
			removeChildren(feedContent);
////
			let activity = data.data.Activity;
			let act = create("div","activity",false,feedContent);
			let diff = NOW() - (new Date(activity.createdAt * 1000)).valueOf();
			let time = create("span",["time","hohMonospace"],formatTime(Math.round(diff/1000),"short"),act,"width:50px;position:absolute;left:1px;top:2px;");
			time.title = (new Date(activity.createdAt * 1000)).toLocaleString();
			let content = create("div",false,false,act,"margin-left:60px;position:relative;");
			if(!activity.user){
				return
			}
			let user = create("a",["link","newTab"],activity.user.name,content);
			if(activity.user.name === whoAmI){
				user.classList.add("thisIsMe")
			}
			user.href = "/user/" + activity.user.name + "/";
			let actions = create("div","actions",false,content,"position:absolute;text-align:right;");
			let replyWrap = create("span",["action","hohReplies"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
			let replyCount = create("span","count",(activity.replies.length || activity.replyCount ? activity.replies.length || activity.replyCount : " "),replyWrap);
			let replyIcon = create("span",false,false,replyWrap);
			replyIcon.appendChild(svgAssets2.reply.cloneNode(true));
			replyWrap.style.cursor = "pointer";
			replyIcon.children[0].style.width = "13px";
			replyIcon.stylemarginLeft = "-2px";
			let likeWrap = create("span",["action","hohLikes"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
			likeWrap.title = activity.likes.map(a => a.name).join("\n");
			let likeCount = create("span","count",(activity.likes.length ? activity.likes.length : " "),likeWrap);
			let heart = create("span",false,"♥",likeWrap,"position:relative;");
			let likeQuickView = create("div","hohLikeQuickView",false,heart);
			likeWrap.style.cursor = "pointer";
			if(activity.likes.some(like => like.name === whoAmI)){
				likeWrap.classList.add("hohILikeThis")
			}
			likeify(activity.likes,likeQuickView);
			likeWrap.onclick = function(){
				authAPIcall(
					"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY){id}}",
					{id: activity.id},
					data => {}
				);
				if(likeWrap.classList.contains("hohILikeThis")){
					activity.likes.splice(activity.likes.findIndex(user => user.name === whoAmI),1);
					if(activity.likes.length === 0){
						likeCount.innerText = " "
					}
					else{
						likeCount.innerText = activity.likes.length
					}
				}
				else{
					activity.likes.push({name: whoAmI});
					likeCount.innerText = activity.likes.length
				}
				likeWrap.classList.toggle("hohILikeThis");
				likeWrap.title = activity.likes.map(a => a.name).join("\n");
				likeify(activity.likes,likeQuickView);
			};
			replyWrap.onclick = function(){
				if(act.querySelector(".replies")){
					act.lastChild.remove()
				}
				else{
					let createReplies = function(){
						let replies = create("div","replies",false,act);
						let statusInput;
						let inputArea;
						let cancelButton;
						let publishButton;
						let onlySpecificActivity = false;
						activity.replies.forEach(reply => {
							reply.text = makeHtml(reply.text);
							let rep = create("div","reply",false,replies);
							let ndiff = NOW() - (new Date(reply.createdAt * 1000)).valueOf();
							let time = create("span",["time","hohMonospace"],formatTime(Math.round(ndiff/1000),"short"),rep,"width:50px;position:absolute;left:1px;top:2px;");
							time.title = (new Date(activity.createdAt * 1000)).toLocaleString();
							let user = create("a",["link","newTab"],reply.user.name,rep,"margin-left:60px;position:absolute;");
							if(reply.user.name === whoAmI){
								user.classList.add("thisIsMe")
							}
							user.href = "/user/" + reply.user.name + "/";
							let text = create("div","status",false,rep,"padding-bottom:10px;margin-left:5px;max-width:100%;padding-top:10px;");
							if(useScripts.termsFeedNoImages && !activity.renderingPermission){
								let imgText = reply.text.replace(/<img.*?src=("|')(.*?)("|').*?>/g,img => {
									let link = img.match(/<img.*?src=("|')(.*?)("|').*?>/)[2];
									return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
								})
								text.innerHTML = DOMPurify.sanitize(imgText)//reason for inner HTML: preparsed sanitized HTML from the Anilist API
							}
							else{
								text.innerHTML = DOMPurify.sanitize(reply.text)//reason for inner HTML: preparsed sanitized HTML from the Anilist API
							}
							Array.from(text.querySelectorAll(".youtube")).forEach(ytLink => {
								create("a",["link","newTab"],"Youtube " + ytLink.id,ytLink)
									.href = "https://www.youtube.com/watch?v=" + ytLink.id
							});
							let actions = create("div","actions",false,rep,"position:absolute;text-align:right;right:4px;bottom:0px;");
							let likeWrap = create("span",["action","hohLikes"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
							likeWrap.title = reply.likes.map(a => a.name).join("\n");
							let likeCount = create("span","count",(reply.likes.length ? reply.likes.length : " "),likeWrap);
							let heart = create("span",false,"♥",likeWrap,"position:relative;");
							let likeQuickView = create("div","hohLikeQuickView",false,heart,"position:absolute;bottom:0px;left:30px;font-size:70%;white-space:nowrap;");
							likeWrap.style.cursor = "pointer";
							if(reply.likes.some(like => like.name === whoAmI)){
								likeWrap.classList.add("hohILikeThis");
							}
							likeify(reply.likes,likeQuickView);
							likeWrap.onclick = function(){
								authAPIcall(
									"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
									{id: reply.id},
									data => {}
								);
								if(likeWrap.classList.contains("hohILikeThis")){
									reply.likes.splice(reply.likes.findIndex(user => user.name === whoAmI),1);
									if(reply.likes.length === 0){
										likeCount.innerText = " ";
									}
									else{
										likeCount.innerText = reply.likes.length;
									}
								}
								else{
									reply.likes.push({name: whoAmI});
									likeCount.innerText = reply.likes.length;
								}
								likeWrap.classList.toggle("hohILikeThis");
								likeWrap.title = reply.likes.map(a => a.name).join("\n");
								likeify(reply.likes,likeQuickView);
							};
							if(reply.user.name === whoAmI){
								let edit = create("a",false,translate("$button_edit"),rep,"position:absolute;top:2px;right:40px;width:10px;cursor:pointer;font-size:small;color:inherit;");
								edit.onclick = function(){
									authAPIcall(
										`query($id: Int){
											ActivityReply(id: $id){
												text(asHtml: false)
											}
										}`,
										{id: reply.id},
										data => {
											if(!data){
												onlySpecificActivity = false;
											}
											inputArea.focus();
											onlySpecificActivity = reply.id;
											inputArea.value = data.data.ActivityReply.text;
										}
									)
								}
							}
						});
						statusInput = create("div",false,false,replies);
						inputArea = create("textarea",false,false,statusInput,"width: 99%;border-width: 1px;padding: 4px;border-radius: 2px;color: rgb(159, 173, 189);resize: vertical;");
						cancelButton = create("button",["hohButton","button"],translate("$button_cancel"),statusInput,"background:rgb(31,35,45);display:none;color: rgb(159, 173, 189);");
						publishButton = create("button",["hohButton","button"],translate("$button_publish"),statusInput,"display:none;");
						inputArea.placeholder = translate("$placeholder_reply");
						inputArea.onfocus = function(){
							cancelButton.style.display = "inline";
							publishButton.style.display = "inline";
						};
						cancelButton.onclick = function(){
							inputArea.value = "";
							cancelButton.style.display = "none";
							publishButton.style.display = "none";
							document.activeElement.blur();
						};
						publishButton.onclick = function(){
							if(onlySpecificActivity){
								loading.innerText = "Editing reply...";
								authAPIcall(
									`mutation($text: String,$id: Int){
										SaveActivityReply(text: $text,id: $id){
											id
											user{name}
											likes{name}
											text(asHtml: true)
											createdAt
										}
									}`,
									{text: emojiSanitize(inputArea.value),id: onlySpecificActivity},
									data => {
										loading.innerText = "";
										if(data){
											for(let j=0;j<activity.replies;j++){
												if(activity.replies[j].id === data.data.SaveActivityReply.id){
													activity.replies[j] = data.data.SaveActivityReply
												}
											}
											act.lastChild.remove();
											createReplies()
										}
									}
								);
								onlySpecificActivity = false
							}
							else{
								loading.innerText = translate("$publishingReply");
								authAPIcall(
									`mutation($text: String,$activityId: Int){
										SaveActivityReply(text: $text,activityId: $activityId){
											id
											user{name}
											likes{name}
											text(asHtml: true)
											createdAt
										}
									}`,
									{text: emojiSanitize(inputArea.value),activityId: activity.id},
									data => {
										loading.innerText = "";
										if(data){
											activity.replies.push(data.data.SaveActivityReply);
											replyCount.innerText = activity.replies.length;
											act.lastChild.remove();
											createReplies()
										}
									}
								)
							}
							inputArea.value = "";
							cancelButton.style.display = "none";
							publishButton.style.display = "none";
							document.activeElement.blur();
						};
					};createReplies()
				}
			};replyWrap.click();
			let status;
			if(activity.type === "TEXT" || activity.type === "MESSAGE"){
				status = create("div",false,false,content,"padding-bottom:10px;width:95%;overflow-wrap:anywhere;");
				activity.text = makeHtml(activity.text);
				if(useScripts.termsFeedNoImages){
					let imgCount = 0;
					let webmCount = 0;
					let imgText = activity.text.replace(/<img.*?src=("|')(.*?)("|').*?>/g,img => {
						let link = img.match(/<img.*?src=("|')(.*?)("|').*?>/)[2];
						imgCount++;
						return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
					}).replace(/<video.*?video>/g,video => {
						let link = video.match(/src=("|')(.*?)("|')/)[2];
						webmCount++;
						return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
					})
					status.innerHTML = DOMPurify.sanitize(imgText);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
					if(imgText !== activity.text){
						let render = create("a",false,"IMG",act,"position:absolute;top:2px;right:20px;cursor:pointer;");
						render.title = "load images";
						if(imgCount === 0 && webmCount){
							render.innerText = "WebM";
							render.title = "load webms"
						}
						else if(imgCount && webmCount){
							render.innerText = "IMG+WebM";
							render.title = "load images and webms"
						}
						render.onclick = () => {
							activity.renderingPermission = true;
							status.innerHTML = DOMPurify.sanitize(activity.text);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
							render.style.display = "none"
						}
					}
				}
				else{
					status.innerHTML = DOMPurify.sanitize(activity.text);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
				}
				Array.from(status.querySelectorAll(".youtube")).forEach(ytLink => {
					create("a",["link","newTab"],ytLink.id,ytLink)
						.href = ytLink.id
				});
				if(activity.user.name === whoAmI && (activity.type === "TEXT" || activity.type === "MESSAGE")){
					let edit = create("a",false,translate("$button_edit"),act,"position:absolute;top:2px;right:40px;width:10px;cursor:pointer;font-size:small;color:inherit;");
					if(useScripts.termsFeedNoImages){
						edit.style.right = "80px"
					}
					edit.onclick = function(){
						loading.innerText = "Loading activity " + activity.id + "...";
						if(terms.scrollIntoView){
							terms.scrollIntoView({"behavior": "smooth","block": "start"})
						}
						else{
							document.body.scrollTop = document.documentElement.scrollTop = 0
						}
						if(activity.type === "MESSAGE"){
							authAPIcall(
								`query($id: Int){
									Activity(id: $id){
										... on MessageActivity{
											text:message(asHtml: false)
										}
									}
								}`,
								{id: activity.id},
								data => {
									if(!data){
										onlySpecificActivity = false;
										loading.innerText = "Failed to load message";
									}
									inputArea.focus();
									onlySpecificActivity = activity.id;
									loading.innerText = "Editing message " + activity.id;
									inputArea.value = data.data.Activity.text;
								}
							)
						}
						else{
							authAPIcall(
								`query($id: Int){
									Activity(id: $id){
										... on TextActivity{
											text(asHtml: false)
										}
									}
								}`,
								{id: activity.id},
								data => {
									if(!data){
										onlySpecificActivity = false;
										loading.innerText = "Failed to load activity";
									}
									inputArea.focus();
									onlySpecificActivity = activity.id;
									loading.innerText = "Editing activity " + activity.id;
									inputArea.value = data.data.Activity.text;
								}
							)
						}
					}
				}
				act.classList.add("text");
				actions.style.right = "21px";
				actions.style.bottom = "4px";
			}
			else{
				status = create("span",false," " + activity.status + " ",content);
				if(activity.progress){
					status.innerText += " " + activity.progress + " of "
				}
				if(activity.media.type === "MANGA"){
					if(activity.status === "read chapter" && activity.progress){
						status.innerText = " " + translate("$listActivity_MreadChapter",activity.progress)
					}
					else if(activity.status === "reread chapter" && activity.progress){
						status.innerText = " " + translate("$listActivity_MrepeatingManga",activity.progress)
					}
					else if(activity.status === "dropped" && activity.progress){
						status.innerText = " " + translate("$listActivity_MdroppedManga",activity.progress)
					}
					else if(activity.status === "dropped"){
						status.innerText = " " + translate("$listActivity_droppedManga")
					}
					else if(activity.status === "completed"){
						status.innerText = " " + translate("$listActivity_completedManga")
					}
					else if(activity.status === "plans to read"){
						status.innerText = " " + translate("$listActivity_planningManga")
					}
					else if(activity.status === "paused reading"){
						status.innerText = " " + translate("$listActivity_pausedManga")
					}
					else{
						console.warn("Missing listActivity translation key for:",activity.status)
					}
				}
				else{
					if(activity.status === "watched episode" && activity.progress){
						status.innerText = " " + translate("$listActivity_MwatchedEpisode",activity.progress)
					}
					else if(activity.status === "rewatched episode" && activity.progress){
						status.innerText = " " + translate("$listActivity_MrepeatingAnime",activity.progress)
					}
					else if(activity.status === "dropped" && activity.progress){
						status.innerText = " " + translate("$listActivity_MdroppedAnime",activity.progress)
					}
					else if(activity.status === "dropped"){
						status.innerText = " " + translate("$listActivity_droppedAnime")
					}
					else if(activity.status === "completed"){
						status.innerText = " " + translate("$listActivity_completedAnime")
					}
					else if(activity.status === "plans to watch"){
						status.innerText = " " + translate("$listActivity_planningAnime")
					}
					else if(activity.status === "paused watching"){
						status.innerText = " " + translate("$listActivity_pausedAnime")
					}
					else{
						console.warn("Missing listActivity translation key for:",activity.status)
					}
				}
				let title = activity.media.title.romaji;
				if(useScripts.titleLanguage === "NATIVE" && activity.media.title.native){
					title = activity.media.title.native
				}
				else if(useScripts.titleLanguage === "ENGLISH" && activity.media.title.english){
					title = activity.media.title.english
				}
				dataMedia.add(title);
				title = titlePicker(activity.media);
				let media = create("a",["link","newTab"],title,content);
				media.href = "/" + activity.media.type.toLowerCase() + "/" + activity.media.id + "/" + safeURL(title) + "/";
				if(activity.media.type === "MANGA" && useScripts.CSSgreenManga){
					media.style.color = "rgb(var(--color-green))"
				}
				act.classList.add("list");
				actions.style.right = "21px";
				actions.style.top = "2px";
				if(useScripts.statusBorder){
					let blockerMap = {
						"plans": "PLANNING",
						"watched": "CURRENT",
						"read": "CURRENT",
						"completed": "COMPLETED",
						"paused": "PAUSED",
						"dropped": "DROPPED",
						"rewatched": "REPEATING",
						"reread": "REPEATING"
					};
					let status = blockerMap[
						Object.keys(blockerMap).find(
							key => activity.status.includes(key)
						)
					]
					if(status === "CURRENT"){
						//nothing
					}
					else if(status === "COMPLETED"){
						act.style.borderLeftWidth = "3px";
						act.style.marginLeft = "-2px";
						if(useScripts.CSSgreenManga && activity.media.type === "ANIME"){
							act.style.borderLeftColor = "rgb(var(--color-blue))";
						}
						else{
							act.style.borderLeftColor = "rgb(var(--color-green))";
						}
					}
					else{
						act.style.borderLeftWidth = "3px";
						act.style.marginLeft = "-2px";
						act.style.borderLeftColor = distributionColours[status]
					}
				}
			}
			let link = create("a",["link","newTab"],false,act,"position:absolute;top:2px;right:4px;width:10px;");
			link.appendChild(svgAssets2.link.cloneNode(true));
			link.href = "https://anilist.co/activity/" + activity.id + "/"
			dataUsers.add(activity.user.name);
			activity.replies.forEach(reply => {
				dataUsers.add(reply.user.name);
				(reply.text.match(/@(.*?)</g) || []).forEach(user => {
					dataUsers.add(user.slice(1,user.length-1))
				})
			})
////
		}
	)
}
//notiLink.href = "/notifications";
notiLink.onclick = function(){
	loading.innerText = translate("$loading");
	let renderNots = function(data){
		loading.innerText = "";
		removeChildren(feedContent);
		(data ? data.data.Page.notifications : []).forEach((notification,index) => {
			let noti = create("div","activity",false,feedContent);
			let diff = NOW() - (new Date(notification.createdAt * 1000)).valueOf();
			let time = create("span",["time","hohMonospace"],formatTime(Math.round(diff/1000),"short"),noti,"width:50px;position:absolute;left:1px;top:2px;");
			time.title = (new Date(notification.createdAt * 1000)).toLocaleString();
			let content = create("div",false,false,noti,"margin-left:60px;position:relative;");
			if(notification.user){
				let user = create("a",["link","newTab"],notification.user.name,content);
				if(notification.user.name === whoAmI){
					user.classList.add("thisIsMe")
				}
				user.href = "/user/" + notification.user.name + "/"
			}
			if(notification.type === "ACTIVITY_LIKE"){
				create("span",false," liked your ",content);
				let activityLink = create("span","ilink","activity",content);
				if(notification.activity.type === "TEXT"){
					activityLink.innerText = "status";
				}
				if(notification.activity.type === "MANGA_LIST"){
					activityLink.classList.add("manga")
				}
				activityLink.onclick = function(){
					viewSingleActivity(notification.activity.id)
				}
			}
			else if(notification.type === "ACTIVITY_REPLY_LIKE"){
				create("span",false," liked your ",content);
				let activityLink = create("span","ilink","reply",content);
				activityLink.onclick = function(){
					viewSingleActivity(notification.activity.id)
				}
			}
			else if(notification.type === "ACTIVITY_REPLY_SUBSCRIBED"){
				create("span",false," replied to subscribed ",content);
				let activityLink = create("span","ilink","activity",content);
				if(notification.activity.type === "TEXT"){
					activityLink.innerText = "status";
				}
				activityLink.onclick = function(){
					viewSingleActivity(notification.activity.id)
				}
			}
			else if(notification.type === "ACTIVITY_MESSAGE"){
				create("span",false," sent you a ",content);
				let activityLink = create("span","ilink","message",content);
				activityLink.onclick = function(){
					viewSingleActivity(notification.activityId)
				}
			}
			else if(notification.type === "ACTIVITY_REPLY"){
				let action = create("span",false," replied to your ",content);
				let activityLink = create("span","ilink","activity",content);
				if(notification.activity.type === "TEXT"){
					activityLink.innerText = "status";
				}
				else if(notification.activity.type === "MESSAGE"){
					action.innerText = " replied to a ";
					activityLink.innerText = "message";
				}
				activityLink.onclick = function(){
					viewSingleActivity(notification.activity.id)
				}
			}
			else if(notification.type === "RELATED_MEDIA_ADDITION"){
				create("span",false,"New media added: ",content);
				let mediaLink = create("span","ilink",notification.media.title.romaji,content);
				if(notification.media.type === "MANGA_LIST"){
					mediaLink.classList.add("manga")
				}
			}
			else if(notification.type === "MEDIA_DATA_CHANGE"){
				create("span",false,"MEDIA_DATA_CHANGE",content);
			}
			else if(notification.type === "ACTIVITY_MENTION"){
				create("span",false," mentioned you",content)
			}
			else if(notification.type === "FOLLOWING"){
				create("span",false," started following you",content)
			}
			else if(notification.type === "AIRING"){
				create("span",false,"Episode ",content);
				create("span",false,notification.episode,content);
				create("span",false," of ",content);
				let mediaLink = create("span","ilink",notification.media.title.romaji,content);
				create("span",false," aired",content);
			}
			else{
				noti.innerText = notification.type
			}
			if((index + 1) === data.data.Viewer.unreadNotificationCount){
				create("hr","divider",false,feedContent);
				noti.style.borderBottomWidth = "1px"
			}
		})
	}
	let callNots = function(){
		authAPIcall(
`
query{
	Viewer{
		unreadNotificationCount
	}
	Page(perPage: 25){
		notifications{
... on AiringNotification{type createdAt episode media{id title{native romaji english}}}
... on FollowingNotification{type createdAt user{name}}
... on ActivityMessageNotification{
	type createdAt user{name}
	activityId
}
... on ActivityMentionNotification{type createdAt user{name}}
... on ActivityReplyNotification{
	type createdAt user{name}
	activity{
... on TextActivity{id type}
... on ListActivity{id type progress}
... on MessageActivity{id type}
	}
}
... on ActivityReplySubscribedNotification{
	type createdAt user{name}
	activity{
... on TextActivity{
	id
	type
}
... on ListActivity{
	id
	type
	progress
}
	}
}
... on ActivityLikeNotification{
	type createdAt user{name}
	activity{
... on TextActivity{
	id
	type
}
... on ListActivity{
	id
	type
	progress
}
	}
}
... on ActivityReplyLikeNotification{
	type createdAt user{name}
	activity{
... on TextActivity{
	id
	type
}
... on MessageActivity{
	id
	type
}
... on ListActivity{
	id
	type
	progress
}
	}
}
... on MediaDataChangeNotification{type createdAt}
... on MediaMergeNotification{type createdAt}
... on MediaDeletionNotification{type createdAt}
... on ThreadCommentMentionNotification{type createdAt}
... on ThreadCommentReplyNotification{type createdAt}
... on ThreadCommentSubscribedNotification{type createdAt}
... on ThreadCommentLikeNotification{type createdAt}
... on ThreadLikeNotification{type createdAt}
... on RelatedMediaAdditionNotification{
	type createdAt
	media{id type title{romaji native english}}
}
		}
	}
}`,
			{},
			function(data){
				if(!data){
					loading.innerText = translate("$error_connection");
					return
				}
				notiLink.title = "no unread notifications"
				renderNots(data)
			}
		)
	};callNots();
}
let buildPage = function(activities,type,requestTime){
	if(requestTime < lastUpdated){
		return
	}
	lastUpdated = requestTime;
	loading.innerText = "";
	pageCount.innerText = translate("$page",page);
	if(page === 1){
		topPrevious.innerText = translate("$button_refresh")
	}
	else{
		topPrevious.innerText = translate("$button_previous")
	}
	removeChildren(feedContent)
	activities.forEach(activity => {
		if(type === "thread" && useScripts.hideAWC && (activity.user === "AnimeWatchingClub" || activity.user === "AWC")){
			return
		}
		let act = create("div","activity",false,feedContent);
		let diff = NOW() - (new Date(activity.createdAt * 1000)).valueOf();
		let time = create("span",["time","hohMonospace"],formatTime(Math.round(diff/1000),"short"),act,"width:50px;position:absolute;left:1px;top:2px;");
		time.title = (new Date(activity.createdAt * 1000)).toLocaleString();
		let content = create("div",false,false,act,"margin-left:60px;position:relative;");
		if(!activity.user){
			return
		}
		let user = create("a",["link","newTab"],activity.user.name,content);
		if(activity.user.name === whoAmI){
			user.classList.add("thisIsMe")
		}
		if(activity.type === "TEXT" && activity.media){
			create("a",false,"'s review of " + titlePicker(activity.media),content)
		}
		user.href = "/user/" + activity.user.name + "/";
		let actions = create("div","actions",false,content,"position:absolute;text-align:right;");
		let replyWrap = create("span",["action","hohReplies"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
		let replyCount = create("span","count",(activity.replies.length || activity.replyCount ? activity.replies.length || activity.replyCount : " "),replyWrap);
		let replyIcon = create("span",false,false,replyWrap);
		replyIcon.appendChild(svgAssets2.reply.cloneNode(true));
		replyWrap.style.cursor = "pointer";
		replyIcon.children[0].style.width = "13px";
		replyIcon.stylemarginLeft = "-2px";
		let likeWrap = create("span",["action","hohLikes"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
		likeWrap.title = activity.likes.map(a => a.name).join("\n");
		let likeCount = create("span","count",(activity.likes.length ? activity.likes.length : " "),likeWrap);
		let heart = create("span",false,"♥",likeWrap,"position:relative;");
		let likeQuickView = create("div","hohLikeQuickView",false,heart);
		if(type === "review"){
			heart.innerText = activity.rating + "/" + activity.ratingAmount
		}
		likeWrap.style.cursor = "pointer";
		if(activity.likes.some(like => like.name === whoAmI)){
			likeWrap.classList.add("hohILikeThis")
		}
		likeify(activity.likes,likeQuickView);
		likeWrap.onclick = function(){
			if(type === "review"){
				return
			}
			authAPIcall(
				"mutation($id:Int){ToggleLike(id:$id,type:" + type.toUpperCase() + "){id}}",
				{id: activity.id},
				data => {}
			);
			if(likeWrap.classList.contains("hohILikeThis")){
				activity.likes.splice(activity.likes.findIndex(user => user.name === whoAmI),1);
				if(activity.likes.length === 0){
					likeCount.innerText = " "
				}
				else{
					likeCount.innerText = activity.likes.length
				}
			}
			else{
				activity.likes.push({name: whoAmI});
				likeCount.innerText = activity.likes.length
			}
			likeWrap.classList.toggle("hohILikeThis");
			likeWrap.title = activity.likes.map(a => a.name).join("\n");
			likeify(activity.likes,likeQuickView);
		};
		replyWrap.onclick = function(){
			if(act.querySelector(".replies")){
				act.lastChild.remove()
			}
			else if(type === "thread"){
				window.location = "https://anilist.co/forum/thread/" + activity.id + "/";//remove when implemented
			}
			else{
				let createReplies = function(){
					let replies = create("div","replies",false,act);
					let statusInput;
					let inputArea;
					let cancelButton;
					let publishButton;
					let onlySpecificActivity = false;
					activity.replies.forEach(reply => {
						reply.text = makeHtml(reply.text);
						let rep = create("div","reply",false,replies);
						let ndiff = NOW() - (new Date(reply.createdAt * 1000)).valueOf();
						let time = create("span",["time","hohMonospace"],formatTime(Math.round(ndiff/1000),"short"),rep,"width:50px;position:absolute;left:1px;top:2px;");
						time.title = (new Date(activity.createdAt * 1000)).toLocaleString();
						let user = create("a",["link","newTab"],reply.user.name,rep,"margin-left:60px;position:absolute;");
						if(reply.user.name === whoAmI){
							user.classList.add("thisIsMe")
						}
						user.href = "/user/" + reply.user.name + "/";
						let text = create("div","status",false,rep,"padding-bottom:10px;margin-left:5px;max-width:100%;padding-top:10px;");
						if(useScripts.termsFeedNoImages && !activity.renderingPermission){
							let imgText = reply.text.replace(/<img.*?src=("|')(.*?)("|').*?>/g,img => {
								let link = img.match(/<img.*?src=("|')(.*?)("|').*?>/)[2];
								return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
							})
							text.innerHTML = DOMPurify.sanitize(imgText)//reason for inner HTML: preparsed sanitized HTML from the Anilist API
						}
						else{
							text.innerHTML = DOMPurify.sanitize(reply.text)//reason for inner HTML: preparsed sanitized HTML from the Anilist API
						}
						Array.from(text.querySelectorAll(".youtube")).forEach(ytLink => {
							create("a",["link","newTab"],"Youtube " + ytLink.id,ytLink)
								.href = "https://www.youtube.com/watch?v=" + ytLink.id
						});
						let actions = create("div","actions",false,rep,"position:absolute;text-align:right;right:4px;bottom:0px;");
						let likeWrap = create("span",["action","hohLikes"],false,actions,"display:inline-block;min-width:35px;margin-left:2px");
						likeWrap.title = reply.likes.map(a => a.name).join("\n");
						let likeCount = create("span","count",(reply.likes.length ? reply.likes.length : " "),likeWrap);
						let heart = create("span",false,"♥",likeWrap,"position:relative;");
						let likeQuickView = create("div","hohLikeQuickView",false,heart,"position:absolute;bottom:0px;left:30px;font-size:70%;white-space:nowrap;");
						likeWrap.style.cursor = "pointer";
						if(reply.likes.some(like => like.name === whoAmI)){
							likeWrap.classList.add("hohILikeThis");
						}
						likeify(reply.likes,likeQuickView);
						likeWrap.onclick = function(){
							authAPIcall(
								"mutation($id:Int){ToggleLike(id:$id,type:ACTIVITY_REPLY){id}}",
								{id: reply.id},
								data => {}
							);
							if(likeWrap.classList.contains("hohILikeThis")){
								reply.likes.splice(reply.likes.findIndex(user => user.name === whoAmI),1);
								if(reply.likes.length === 0){
									likeCount.innerText = " ";
								}
								else{
									likeCount.innerText = reply.likes.length;
								}
							}
							else{
								reply.likes.push({name: whoAmI});
								likeCount.innerText = reply.likes.length;
							}
							likeWrap.classList.toggle("hohILikeThis");
							likeWrap.title = reply.likes.map(a => a.name).join("\n");
							likeify(reply.likes,likeQuickView);
						};
						if(reply.user.name === whoAmI){
							let edit = create("a",false,translate("$button_edit"),rep,"position:absolute;top:2px;right:40px;width:10px;cursor:pointer;font-size:small;color:inherit;");
							edit.onclick = function(){
								authAPIcall(
									`query($id: Int){
										ActivityReply(id: $id){
											text(asHtml: false)
										}
									}`,
									{id: reply.id},
									data => {
										if(!data){
											onlySpecificActivity = false;
										}
										inputArea.focus();
										onlySpecificActivity = reply.id;
										inputArea.value = data.data.ActivityReply.text;
									}
								)
							}
						}
					});
					statusInput = create("div",false,false,replies);
					inputArea = create("textarea",false,false,statusInput,"width: 99%;border-width: 1px;padding: 4px;border-radius: 2px;color: rgb(159, 173, 189);resize: vertical;");
					cancelButton = create("button",["hohButton","button"],translate("$button_cancel"),statusInput,"background:rgb(31,35,45);display:none;color: rgb(159, 173, 189);");
					publishButton = create("button",["hohButton","button"],translate("$button_publish"),statusInput,"display:none;");
					inputArea.placeholder = translate("$placeholder_reply");
					inputArea.onfocus = function(){
						cancelButton.style.display = "inline";
						publishButton.style.display = "inline";
					};
					cancelButton.onclick = function(){
						inputArea.value = "";
						cancelButton.style.display = "none";
						publishButton.style.display = "none";
						document.activeElement.blur();
					};
					publishButton.onclick = function(){
						if(onlySpecificActivity){
							loading.innerText = "Editing reply...";
							authAPIcall(
								`mutation($text: String,$id: Int){
									SaveActivityReply(text: $text,id: $id){
										id
										user{name}
										likes{name}
										text(asHtml: true)
										createdAt
									}
								}`,
								{text: emojiSanitize(inputArea.value),id: onlySpecificActivity},
								data => {
									loading.innerText = "";
									if(data){
										for(let j=0;j<activity.replies;j++){
											if(activity.replies[j].id === data.data.SaveActivityReply.id){
												activity.replies[j] = data.data.SaveActivityReply
											}
										}
										act.lastChild.remove();
										createReplies()
									}
								}
							);
							onlySpecificActivity = false
						}
						else{
							loading.innerText = translate("$publishingReply");
							authAPIcall(
								`mutation($text: String,$activityId: Int){
									SaveActivityReply(text: $text,activityId: $activityId){
										id
										user{name}
										likes{name}
										text(asHtml: true)
										createdAt
									}
								}`,
								{text: emojiSanitize(inputArea.value),activityId: activity.id},
								data => {
									loading.innerText = "";
									if(data){
										activity.replies.push(data.data.SaveActivityReply);
										replyCount.innerText = activity.replies.length;
										act.lastChild.remove();
										createReplies()
									}
								}
							)
						}
						inputArea.value = "";
						cancelButton.style.display = "none";
						publishButton.style.display = "none";
						document.activeElement.blur();
					};
				};createReplies()
			}
		};
		let status;
		if(activity.type === "TEXT" || activity.type === "MESSAGE"){
			status = create("div",false,false,content,"padding-bottom:10px;width:95%;overflow-wrap:anywhere;");
			activity.text = makeHtml(activity.text);
			//activity.text = "<p>" + activity.text.replace(/\n\n/g,"</p><p>") + "</p>";//workaround for API bug
			if(useScripts.termsFeedNoImages){
				let imgCount = 0;
				let webmCount = 0;
				let imgText = activity.text.replace(/<img.*?src=("|')(.*?)("|').*?>/g,img => {
					let link = img.match(/<img.*?src=("|')(.*?)("|').*?>/)[2];
					imgCount++;
					return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
				}).replace(/<video.*?video>/g,video => {
					let link = video.match(/src=("|')(.*?)("|')/)[2];
					webmCount++;
					return "[<a href=\"" + link + "\">" + (link.length > 200 ? link.slice(0,200) + "…" : link) + "</a>]"
				})
				status.innerHTML = DOMPurify.sanitize(imgText);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
				if(imgText !== activity.text){
					let render = create("a",false,"IMG",act,"position:absolute;top:2px;right:20px;cursor:pointer;");
					render.title = "load images";
					if(imgCount === 0 && webmCount){
						render.innerText = "WebM";
						render.title = "load webms"
					}
					else if(imgCount && webmCount){
						render.innerText = "IMG+WebM";
						render.title = "load images and webms"
					}
					render.onclick = () => {
						activity.renderingPermission = true;
						status.innerHTML = DOMPurify.sanitize(activity.text);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
						render.style.display = "none"
					}
				}
			}
			else{
				status.innerHTML = DOMPurify.sanitize(activity.text);//reason for inner HTML: preparsed sanitized HTML from the Anilist API
			}
			Array.from(status.querySelectorAll(".youtube")).forEach(ytLink => {
				create("a",["link","newTab"],ytLink.id,ytLink)
					.href = ytLink.id
			});
			if(activity.user.name === whoAmI && (activity.type === "TEXT" || activity.type === "MESSAGE") && type !== "thread"){
				let edit = create("a",false,translate("$button_edit"),act,"position:absolute;top:2px;right:40px;width:10px;cursor:pointer;font-size:small;color:inherit;");
				if(useScripts.termsFeedNoImages){
					edit.style.right = "80px"
				}
				edit.onclick = function(){
					loading.innerText = "Loading activity " + activity.id + "...";
					if(terms.scrollIntoView){
						terms.scrollIntoView({"behavior": "smooth","block": "start"})
					}
					else{
						document.body.scrollTop = document.documentElement.scrollTop = 0
					}
					if(activity.type === "MESSAGE"){
						authAPIcall(
							`query($id: Int){
								Activity(id: $id){
									... on MessageActivity{
										text:message(asHtml: false)
									}
								}
							}`,
							{id: activity.id},
							data => {
								if(!data){
									onlySpecificActivity = false;
									loading.innerText = "Failed to load message";
								}
								inputArea.focus();
								onlySpecificActivity = activity.id;
								loading.innerText = "Editing message " + activity.id;
								inputArea.value = data.data.Activity.text;
							}
						)
					}
					else{
						authAPIcall(
							`query($id: Int){
								Activity(id: $id){
									... on TextActivity{
										text(asHtml: false)
									}
								}
							}`,
							{id: activity.id},
							data => {
								if(!data){
									onlySpecificActivity = false;
									loading.innerText = "Failed to load activity";
								}
								inputArea.focus();
								onlySpecificActivity = activity.id;
								loading.innerText = "Editing activity " + activity.id;
								inputArea.value = data.data.Activity.text;
							}
						)
					}
				}
			}
			act.classList.add("text");
			actions.style.right = "21px";
			actions.style.bottom = "4px";
		}
		else{
			status = create("span",false," " + activity.status + " ",content);
			if(activity.progress){
				status.innerText += " " + activity.progress + " of "
			}
			if(activity.media.type === "MANGA"){
				if(activity.status === "read chapter" && activity.progress){
					status.innerText = " " + translate("$listActivity_MreadChapter",activity.progress)
				}
				else if(activity.status === "reread chapter" && activity.progress){
					status.innerText = " " + translate("$listActivity_MrepeatingManga",activity.progress)
				}
				else if(activity.status === "dropped" && activity.progress){
					status.innerText = " " + translate("$listActivity_MdroppedManga",activity.progress)
				}
				else if(activity.status === "dropped"){
					status.innerText = " " + translate("$listActivity_droppedManga")
				}
				else if(activity.status === "completed"){
					status.innerText = " " + translate("$listActivity_completedManga")
				}
				else if(activity.status === "plans to read"){
					status.innerText = " " + translate("$listActivity_planningManga")
				}
				else if(activity.status === "paused reading"){
					status.innerText = " " + translate("$listActivity_pausedManga")
				}
				else{
					console.warn("Missing listActivity translation key for:",activity.status)
				}
			}
			else{
				if(activity.status === "watched episode" && activity.progress){
					status.innerText = " " + translate("$listActivity_MwatchedEpisode",activity.progress)
				}
				else if(activity.status === "rewatched episode" && activity.progress){
					status.innerText = " " + translate("$listActivity_MrepeatingAnime",activity.progress)
				}
				else if(activity.status === "dropped" && activity.progress){
					status.innerText = " " + translate("$listActivity_MdroppedAnime",activity.progress)
				}
				else if(activity.status === "dropped"){
					status.innerText = " " + translate("$listActivity_droppedAnime")
				}
				else if(activity.status === "completed"){
					status.innerText = " " + translate("$listActivity_completedAnime")
				}
				else if(activity.status === "plans to watch"){
					status.innerText = " " + translate("$listActivity_planningAnime")
				}
				else if(activity.status === "paused watching"){
					status.innerText = " " + translate("$listActivity_pausedAnime")
				}
				else{
					console.warn("Missing listActivity translation key for:",activity.status)
				}
			}
			let title = activity.media.title.romaji;
			if(useScripts.titleLanguage === "NATIVE" && activity.media.title.native){
				title = activity.media.title.native
			}
			else if(useScripts.titleLanguage === "ENGLISH" && activity.media.title.english){
				title = activity.media.title.english
			}
			dataMedia.add(title);
			title = titlePicker(activity.media);
			let media = create("a",["link","newTab"],title,content);
			media.href = "/" + activity.media.type.toLowerCase() + "/" + activity.media.id + "/" + safeURL(title) + "/";
			if(activity.media.type === "MANGA" && useScripts.CSSgreenManga){
				media.style.color = "rgb(var(--color-green))"
			}
			act.classList.add("list");
			actions.style.right = "21px";
			actions.style.top = "2px";
			if(useScripts.statusBorder){
				let blockerMap = {
					"plans": "PLANNING",
					"watched": "CURRENT",
					"read": "CURRENT",
					"completed": "COMPLETED",
					"paused": "PAUSED",
					"dropped": "DROPPED",
					"rewatched": "REPEATING",
					"reread": "REPEATING"
				};
				let status = blockerMap[
					Object.keys(blockerMap).find(
						key => activity.status.includes(key)
					)
				]
				if(status === "CURRENT"){
					//nothing
				}
				else if(status === "COMPLETED"){
					act.style.borderLeftWidth = "3px";
					act.style.marginLeft = "-2px";
					if(useScripts.CSSgreenManga && activity.media.type === "ANIME"){
						act.style.borderLeftColor = "rgb(var(--color-blue))";
					}
					else{
						act.style.borderLeftColor = "rgb(var(--color-green))";
					}
				}
				else{
					act.style.borderLeftWidth = "3px";
					act.style.marginLeft = "-2px";
					act.style.borderLeftColor = distributionColours[status]
				}
			}
		}
		let link = create("a",["link","newTab"],false,act,"position:absolute;top:2px;right:4px;width:10px;");
		link.appendChild(svgAssets2.link.cloneNode(true));
		if(type === "thread"){
			link.href = "https://anilist.co/forum/thread/" + activity.id + "/"
		}
		else{
			link.href = "https://anilist.co/" + type + "/" + activity.id + "/"
		}
		if(activity.user.name === whoAmI){
			let deleteActivity = create("span","hohDeleteActivity",svgAssets.cross,act);
			deleteActivity.title = "Delete";
			deleteActivity.onclick = function(){
				authAPIcall(
					"mutation($id: Int){Delete" + capitalize(type) + "(id: $id){deleted}}",
					{id: activity.id},
					function(data){
						if(data.data.DeleteActivity.deleted){
							act.style.display = "none"
						}
					}
				)
			}
		}
		dataUsers.add(activity.user.name);
		activity.replies.forEach(reply => {
			dataUsers.add(reply.user.name);
			(reply.text.match(/@(.*?)</g) || []).forEach(user => {
				dataUsers.add(user.slice(1,user.length-1))
			})
		})
	});
	if(terms.scrollIntoView){
		terms.scrollIntoView({"behavior": "smooth","block": "start"})
	}
	else{
		document.body.scrollTop = document.documentElement.scrollTop = 0
	}
	removeChildren(dataUsersList)
	dataUsers.forEach(user => {
		create("option",false,false,dataUsersList)
			.value = user
	});
	removeChildren(dataMediaList)
	dataMedia.forEach(media => {
		create("option",false,false,dataMediaList)
			.value = media
	})
};
let requestPage = function(npage,userID){
	page = npage;
	changeURL();
	let types = [];
	if(!onlyUser.checked || date){
		types.push("MESSAGE")
	}
	if(onlyStatus.checked){
		types.push("ANIME_LIST","MANGA_LIST")
	}
	let specificUser = onlyUserInput.value || whoAmI;
	if(onlyUser.checked && !userID){
		generalAPIcall("query($name:String){User(name:$name){id}}",{name: specificUser},function(data){
			if(data){
				requestPage(npage,data.data.User.id)
			}
			else{
				loading.innerText = "Not Found";
				deleteCacheItem("hohIDlookup" + specificUser.toLowerCase());
				if(!onlyUserInput.value){
					requestPage(npage)
				}
			}
		},"hohIDlookup" + specificUser.toLowerCase());
		return;
	}
	let requestTime = NOW();
	if(onlyForum.checked){
		authAPIcall(
			`
query($page: Int){
Page(page: $page){
	threads(sort:REPLIED_AT_DESC${(onlyUser.checked ? ",userId: " + userID : "")}${onlyMedia.checked && onlyMediaResult.id ? ",mediaCategoryId: " + onlyMediaResult.id : ""}){
		id
		createdAt
		user{name}
		text:body
		likes{name}
		title
		replyCount
	}
}
Viewer{unreadNotificationCount}
}`,
			{page: npage},
			function(data){
				if(!data){
					loading.innerText = translate("$error_connection");
					return
				}
				buildPage(data.data.Page.threads.map(thread => {
					thread.type = "TEXT";
					thread.replies = [];
					thread.text = "<h2>" + thread.title + "</h2>" + thread.text;
					return thread
				}).filter(thread => thread.replyCount || !onlyReplies.checked),"thread",requestTime);
				handleNotifications(data)
			}
		)
	}
	else if(onlyReviews.checked){
		authAPIcall(
			`
query($page: Int){
Page(page: $page,perPage: 20){
	reviews(sort:CREATED_AT_DESC${(onlyUser.checked ? ",userId: " + userID : "")}${onlyMedia.checked && onlyMediaResult.id ? ",mediaId: " + onlyMediaResult.id : ""}){
		id
		createdAt
		user{name}
		media{
			id
			type
			title{romaji native english}
		}
		summary
		body
		rating
		ratingAmount
	}
}
Viewer{unreadNotificationCount}
}`,
			{page: npage},
			function(data){
				if(!data){
					loading.innerText = translate("$error_connection");
					return
				}
				buildPage(data.data.Page.reviews.map(review => {
					review.type = "TEXT";
					review.likes = [];
					review.replies = [{
						id: review.id,
						user: review.user,
						likes: [],
						text: review.body,
						createdAt: review.createdAt
					}];
					review.text = review.summary;
					return review
				}),"review",requestTime);
				handleNotifications(data)
			}
		)
	}
	else{
		authAPIcall(
			`
query($page: Int,$types: [ActivityType]){
Page(page: $page){
	activities(${(onlyUser.checked || onlyGlobal.checked ? "" : "isFollowing: true,")}sort: ID_DESC,type_not_in: $types${(onlyReplies.checked ? ",hasReplies: true" : "")}${(onlyUser.checked ? ",userId: " + userID : "")}${(onlyGlobal.checked ? ",hasRepliesOrTypeText: true" : "")}${onlyMedia.checked && onlyMediaResult.id ? ",mediaId: " + onlyMediaResult.id : ""}${date ? ",createdAt_greater: " + ((new Date(date)).valueOf()/1000) + ",createdAt_lesser: " + ((new Date(date)).valueOf()/1000 + 24*60*60) : ""}){
		... on MessageActivity{
			id
			type
			createdAt
			user:messenger{name}
			text:message
			likes{name}
			replies{
				id
				user{name}
				likes{name}
				text
				createdAt
			}
		}
		... on TextActivity{
			id
			type
			createdAt
			user{name}
			text
			likes{name}
			replies{
				id
				user{name}
				likes{name}
				text
				createdAt
			}
		}
		... on ListActivity{
			id
			type
			createdAt
			user{name}
			status
			progress
			media{
				id
				type
				title{romaji native english}
			}
			likes{name}
			replies{
				id
				user{name}
				likes{name}
				text
				createdAt
			}
		}
	}
}
Viewer{unreadNotificationCount}
}`,
			{page: npage,types:types},
			function(data){
				if(!data){
					loading.innerText = translate("$error_connection");
					return
				}
				buildPage(data.data.Page.activities,"activity",requestTime);
				handleNotifications(data)
			}
		)
	}
};
requestPage(page);
let setInputs = function(){
	statusInputTitle.style.display = "none";
	if(onlyReviews.checked){
		inputArea.placeholder = "Writing reviews not supported yet...";
		publishButton.innerText = translate("$button_publish")
	}
	else if(onlyForum.checked){
		inputArea.placeholder = translate("$placeholder_forum");
		statusInputTitle.style.display = "block";
		publishButton.innerText = translate("$button_publish")
	}
	else if(onlyUser.checked && onlyUserInput.value && onlyUserInput.value.toLowerCase() !== whoAmI.toLowerCase()){
		inputArea.placeholder = translate("$placeholder_message");
		publishButton.innerText = "Send"
	}
	else{
		inputArea.placeholder = translate("$placeholder_status");
		publishButton.innerText = translate("$button_publish")
	}
};
topPrevious.onclick = function(){
	loading.innerText = translate("$loading");
	if(page === 1){
		requestPage(1)
	}
	else{
		requestPage(page - 1)
	}
};
topNext.onclick = function(){
	loading.innerText = translate("$loading");
	requestPage(page + 1)
};
onlyGlobal.onchange = function(){
	loading.innerText = translate("$loading");
	statusInputTitle.style.display = "none";
	inputArea.placeholder = translate("$placeholder_status");
	onlyUser.checked = false;
	onlyForum.checked = false;
	onlyReviews.checked = false;
	requestPage(1)
};
onlyStatus.onchange = function(){
	loading.innerText = translate("$loading");
	onlyForum.checked = false;
	onlyReviews.checked = false;
	onlyMedia.checked = false;
	requestPage(1)
};
onlyReplies.onchange = function(){
	loading.innerText = translate("$loading");
	onlyReviews.checked = false;
	requestPage(1)
};
onlyUser.onchange = function(){
	setInputs();
	loading.innerText = translate("$loading");
	onlyGlobal.checked = false;
	requestPage(1)
};
onlyForum.onchange = function(){
	setInputs();
	loading.innerText = translate("$loading");
	onlyGlobal.checked = false;
	onlyStatus.checked = false;
	onlyReviews.checked = false;
	requestPage(1)
};
onlyMedia.onchange = function(){
	setInputs();
	loading.innerText = translate("$loading");
	requestPage(1)
};
onlyReviews.onchange = function(){
	setInputs();
	onlyGlobal.checked = false;
	onlyStatus.checked = false;
	onlyForum.checked = false;
	onlyReplies.checked = false;
	loading.innerText = translate("$loading");
	requestPage(1)
}
let oldOnlyUser = "";
onlyUserInput.onfocus = function(){
	oldOnlyUser = onlyUserInput.value
};
let oldOnlyMedia = "";
onlyMediaInput.onfocus = function(){
	oldOnlyMedia = onlyMediaInput.value
};
onlyMediaInput.onblur = function(){
	if(onlyMediaInput.value === oldOnlyMedia){
		return
	}
	if(onlyMediaInput.value === ""){
		removeChildren(mediaDisplayResults)
		onlyMediaResult.id = false
	}
	else{
		if(!mediaDisplayResults.childElementCount){
			create("span",false,translate("$searching"),mediaDisplayResults);
		}
		generalAPIcall(`
			query($search: String){
				Page(page:1,perPage:5){
					media(search:$search,sort:SEARCH_MATCH){
						title{romaji native english}
						id
						type
					}
				}
			}`,
			{search: onlyMediaInput.value},
			function(data){
				removeChildren(mediaDisplayResults)
				data.data.Page.media.forEach((media,index) => {
					let result = create("div",["hohSearchResult",media.type.toLowerCase()],false,mediaDisplayResults);
					let title = create("span",false,titlePicker(media),result);
					if(useScripts.accessToken){
						let editButton = create("span","termsFeedEdit","edit",result);
						editButton.onclick = function(){
							event.stopPropagation();
							event.preventDefault();
							authAPIcall(`
								query($id: Int,$userName: String){
									MediaList(
										userName: $userName,
										mediaId: $id
									){
										progress
										score
										status
										id
									}
								}`,
								{id: media.id,userName: whoAmI},
								function(entry,paras,errors){
									if(!entry && errors.errors[0].message !== "Not Found."){
										console.log(errors);
										return
									}
									let editor = createDisplayBox("width:600px;height:500px;top:100px;left:220px",titlePicker(media));
									let progressLabel = create("p",false,translate("$preview_progress"),editor);
									let progressInput = create("input","hohInput",false,editor);
									progressInput.type = "number";
									progressInput.min = 0;
									if(entry && entry.data.MediaList.progress){
										progressInput.value = entry.data.MediaList.progress
									}
									else{
										progressInput.value = 0
									}

									let scoreLabel = create("p",false,translate("$preview_score"),editor);
									let scoreInput = create("input","hohInput",false,editor);
									scoreInput.type = "number";
									scoreInput.min = 0;
									if(entry && entry.data.MediaList.score){
										scoreInput.value = entry.data.MediaList.score
									}

									create("hr",false,false,editor);

									let saveButton = create("button","hohButton","Save",editor);
									let hohSpinner = create("span","hohSpinner","",editor);
									saveButton.onclick = function(){
										hohSpinner.innerText = svgAssets.loading;
										hohSpinner.classList.remove("spinnerError");
										hohSpinner.classList.remove("spinnerDone");
										hohSpinner.classList.add("spinnerLoading");
										if(entry){
											authAPIcall(
												`mutation($progress: Int${(parseFloat(scoreInput.value) ? ",$score: Float" : "")},$id: Int){
													SaveMediaListEntry(progress: $progress,id:$id${(parseFloat(scoreInput.value) ? ", score: $score" : "")}){id}
												}`,
												{id: entry.data.MediaList.id, progress: parseInt(progressInput.value), score: parseFloat(scoreInput.value)},
												data => {
													hohSpinner.classList.remove("spinnerLoading");
													if(data && data[0] && data[0].message){
														hohSpinner.classList.add("spinnerError");
														hohSpinner.innerText = svgAssets.cross;
													}
													else{
														hohSpinner.innerText = svgAssets.check;
														hohSpinner.classList.add("spinnerDone");
													}
												}
											)
										}
										else{
											authAPIcall(
												`mutation($progress: Int${(parseFloat(scoreInput.value) ? ",$score: Float" : "")},$id: Int){
													SaveMediaListEntry(progress: $progress${(parseFloat(scoreInput.value) ? ", score: $score" : "")}),mediaId:$id){id}
												}`,
												{id: media.id, progress: parseInt(progressInput.value), score: parseFloat(scoreInput.value)},
												data => {
													hohSpinner.classList.remove("spinnerLoading");
													if(data && data[0] && data[0].message){
														hohSpinner.classList.add("spinnerError");
														hohSpinner.innerText = svgAssets.cross;
													}
													else{
														hohSpinner.innerText = svgAssets.check;
														hohSpinner.classList.add("spinnerDone");
													}
												}
											)
										}
									}
								}
							)
						}
					}
					if(index === 0){
						result.classList.add("selected");
						onlyMediaResult.id = media.id;
						onlyMediaResult.type = media.type
					}
					result.onclick = function(){
						mediaDisplayResults.querySelector(".selected").classList.toggle("selected");
						result.classList.add("selected");
						onlyMediaResult.id = media.id;
						onlyMediaResult.type = media.type;
						onlyMedia.checked = true;
						onlyStatus.checked = false;
						loading.innerText = translate("$loading");
						requestPage(1)
					}
				});
				if(data.data.Page.media.length){
					onlyMedia.checked = true;
					onlyStatus.checked = false;
					loading.innerText = translate("$loading");
					requestPage(1)
				}
				else{
					create("span",false,translate("$noResults"),mediaDisplayResults);
					onlyMediaResult.id = false
				}
			}
		)
	}
};
onlyUserInput.onblur = function(){
	if(onlyForum.checked){
		inputArea.placeholder = translate("$placeholder_forum");
		publishButton.innerText = translate("$button_publish")
	}
	else if(
		(onlyUser.checked && onlyUserInput.value && onlyUserInput.value.toLowerCase() !== whoAmI.toLowerCase())
		|| (oldOnlyUser !== onlyUserInput.value && onlyUserInput.value !== "")
	){
		inputArea.placeholder = translate("$placeholder_message");
		publishButton.innerText = "Send"
	}
	else{
		inputArea.placeholder = translate("$placeholder_status");
		publishButton.innerText = translate("$button_publish")
	}
	if(oldOnlyUser !== onlyUserInput.value && onlyUserInput.value !== ""){
		loading.innerText = translate("$loading");
		onlyUser.checked = true;
		requestPage(1)
	}
	else if(onlyUser.checked && oldOnlyUser !== onlyUserInput.value){
		loading.innerText = translate("$loading");
		requestPage(1)
	}
};
onlyUserInput.addEventListener("keyup",function(event){
	if(event.key === "Enter"){
		onlyUserInput.blur()
	}
});
onlyMediaInput.addEventListener("keyup",function(event){
	if(event.key === "Enter"){
		onlyMediaInput.blur()
	}
});
inputArea.onfocus = function(){
	cancelButton.style.display = "inline";
	publishButton.style.display = "inline";
	previewArea.style.display = "inline"
};
inputArea.oninput = function(){
	previewArea.innerHTML = DOMPurify.sanitize(makeHtml(inputArea.value))
}
cancelButton.onclick = function(){
	inputArea.value = "";
	inputArea.rows = 3;
	inputArea.style.height = "unset";
	previewArea.innerText = "";
	cancelButton.style.display = "none";
	publishButton.style.display = "none";
	previewArea.style.display = "none";
	loading.innerText = "";
	onlySpecificActivity = false;
	document.activeElement.blur()
};
publishButton.onclick = function(){
	if(onlyForum.checked){
		alert(translate("$notImplemented"));
		//loading.innerText = "Publishing forum post...";
		return
	}
	else if(onlyReviews.checked){
		alert(translate("$notImplemented"));
		//loading.innerText = "Publishing review...";
		return
	}
	else if(onlySpecificActivity){
		loading.innerText = "Publishing...";
		let mutation;
		if(onlyUser.checked && onlyUserInput.value && onlyUserInput.value.toLowerCase() !== whoAmI.toLowerCase()){
			mutation = "mutation($text: String,$id: Int){SaveMessageActivity(id: $id,message: $text){id}}"
		}
		else{
			mutation = "mutation($text: String,$id: Int){SaveTextActivity(id: $id,text: $text){id}}"
		}
		authAPIcall(
			mutation,
			{text: inputArea.value,id: onlySpecificActivity},
			function(data){
				onlySpecificActivity = false;
				requestPage(1)
			}
		)
	}
	else if(onlyUser.checked && onlyUserInput.value && onlyUserInput.value.toLowerCase() !== whoAmI.toLowerCase()){
		loading.innerText = "Sending Message...";
		generalAPIcall("query($name:String){User(name:$name){id}}",{name: onlyUserInput.value},function(data){
			if(data){
				authAPIcall(
					"mutation($text: String,$recipientId: Int){SaveMessageActivity(message: $text,recipientId: $recipientId){id}}",
					{
						text: emojiSanitize(inputArea.value),
						recipientId: data.data.User.id
					},
					function(data){
						requestPage(1)
					}
				)
			}
			else{
				loading.innerText = "Not Found"
			}
		},"hohIDlookup" + onlyUserInput.value.toLowerCase())
	}
	else{
		loading.innerText = "Publishing...";
		authAPIcall(
			"mutation($text: String){SaveTextActivity(text: $text){id}}",
			{text: emojiSanitize(inputArea.value)},
			function(data){
				requestPage(1)
			}
		)
	}
	inputArea.value = "";
	previewArea.innerText = "";
	cancelButton.style.display = "none";
	publishButton.style.display = "none";
	document.activeElement.blur()
};
let sideBarContent = create("div","sidebar",false,feed,"position:absolute;left:20px;top:200px;max-width:150px;");
let buildPreview = function(data){
	if(!data){
		return
	}
	removeChildren(sideBarContent)
	let mediaLists = data.data.Page.mediaList.map(mediaList => {
		if(aliases.has(mediaList.media.id)){
			mediaList.media.title.userPreferred = aliases.get(mediaList.media.id)
		}
		return mediaList
	});
	mediaLists.slice(0,20).forEach(mediaList => {
		let mediaEntry = create("div",false,false,sideBarContent,"border-bottom: solid;border-bottom-width: 1px;margin-bottom: 10px;border-radius: 3px;padding: 2px;");
		create("a","link",mediaList.media.title.userPreferred,mediaEntry,"min-height:40px;display:inline-block;")
			.href = "/anime/" + mediaList.media.id + "/" + safeURL(mediaList.media.title.userPreferred);
		let progress = create("div",false,false,mediaEntry,"font-size: small;");
		create("span",false,translate("$preview_progress") + " ",progress);
		let number = create("span",false,mediaList.progress + (mediaList.media.episodes ? "/" + mediaList.media.episodes : ""),progress);
		let plusProgress = create("span",false,"+",progress,"padding-left:5px;padding-right:5px;cursor:pointer;");
		let isBlocked = false;
		plusProgress.onclick = function(e){
			if(isBlocked){
				return
			}
			if(mediaList.media.episodes){
				if(mediaList.progress < mediaList.media.episodes){
					mediaList.progress++;
					number.innerText = mediaList.progress + (mediaList.media.episodes ? "/" + mediaList.media.episodes : "");
					isBlocked = true;
					setTimeout(function(){
						isBlocked = false;
					},300);
					if(mediaList.progress === mediaList.media.episodes){
						plusProgress.innerText = "";
						if(mediaList.status === "REWATCHING"){//don't overwrite the existing end date
							authAPIcall(
								`mutation($progress: Int,$id: Int){
									SaveMediaListEntry(progress: $progress,id:$id,status:COMPLETED){id}
								}`,
								{id: mediaList.id,progress: mediaList.progress},
								data => {}
							)
						}
						else{
							authAPIcall(
								`mutation($progress: Int,$id: Int,$date:FuzzyDateInput){
									SaveMediaListEntry(progress: $progress,id:$id,status:COMPLETED,completedAt:$date){id}
								}`,
								{
									id: mediaList.id,
									progress: mediaList.progress,
									date: {
										year: (new Date()).getUTCFullYear(),
										month: (new Date()).getUTCMonth() + 1,
										day: (new Date()).getUTCDate(),
									}
								},
								data => {}
							)
						}
						mediaEntry.style.backgroundColor = "rgba(0,200,0,0.1)"
					}
					else{
						authAPIcall(
							`mutation($progress: Int,$id: Int){
								SaveMediaListEntry(progress: $progress,id:$id){id}
							}`,
							{id: mediaList.id,progress: mediaList.progress},
							data => {}
						)
					}
					localStorage.setItem("hohListPreview",JSON.stringify(data))
				}
			}
			else{
				mediaList.progress++;
				number.innerText = mediaList.progress + (mediaList.media.episodes ? "/" + mediaList.media.episodes : "");
				isBlocked = true;
				setTimeout(function(){
					isBlocked = false;
				},300);
				authAPIcall(
					`mutation($progress: Int,$id: Int){
						SaveMediaListEntry(progress: $progress,id:$id){id}
					}`,
					{id: mediaList.id,progress: mediaList.progress},
					data => {}
				);
				localStorage.setItem("hohListPreview",JSON.stringify(data))
			}
			e.stopPropagation();
			e.preventDefault();
			return false
		}
	})
};
authAPIcall(
	`query($name: String){
		Page(page:1){
			mediaList(type:ANIME,status_in:[CURRENT,REPEATING],userName:$name,sort:UPDATED_TIME_DESC){
				id
				priority
				scoreRaw: score(format: POINT_100)
				progress
				status
				media{
					id
					episodes
					coverImage{large color}
					title{userPreferred}
					nextAiringEpisode{episode timeUntilAiring}
				}
			}
		}
	}`,{name: whoAmI},function(data){
		localStorage.setItem("hohListPreview",JSON.stringify(data));
		buildPreview(data,true)
	}
);
buildPreview(JSON.parse(localStorage.getItem("hohListPreview")),false)
}
})
//end modules/termsFeed.js
//begin modules/tweets.js
exportModule({
	id: "tweets",
	description: "$setting_tweets",
	extendedDescription: `
This works by running Twitter's official embedding script. Be advised that Twitter embeds display NSFW content no differently than other content.
	`,
	isDefault: false,
	categories: ["Feeds"],
	visible: true,
	boneless_disabled: true
})

const isPublishedMozillaAddon = false;
let tweetLoop;
if(useScripts.tweets && !isPublishedMozillaAddon){
	tweetLoop = setInterval(function(){
		document.querySelectorAll(
			`.markdown a[href^="https://twitter.com/"][href*="/status/"]`
		).forEach(tweet => {
			if(tweet.classList.contains("hohEmbedded")){
				return
			}
			let tweetMatch = tweet.href.match(/^https:\/\/twitter\.com\/(.+?)\/status\/\d+/)
			if(!tweetMatch || tweet.href !== tweet.innerText){
				return
			}
			tweet.classList.add("hohEmbedded");
			let tweetBlockQuote = create("blockquote",false,false,tweet);
			tweetBlockQuote.classList.add("twitter-tweet");
			if(document.body.classList.contains("site-theme-dark")){
				tweetBlockQuote.setAttribute("data-theme","dark")
			}
			let tweetBlockQuoteInner = create("p",false,false,tweetBlockQuote);
			tweetBlockQuoteInner.setAttribute("lang","en");
			tweetBlockQuoteInner.setAttribute("dir","ltr");
			let tweetBlockQuoteInnerInner = create("a","hohEmbedded","Loading tweet by " + tweetMatch[1] + "...",tweetBlockQuoteInner)
				.href = tweet.href;
			if(document.getElementById("hohTwitterEmbed") && window.twttr){
				window.twttr.widgets.load(tweet)
			}
			else{
				let script = document.createElement("script");
				script.setAttribute("src","https://platform.twitter.com/widgets.js");
				script.setAttribute("async","");
				script.id = "hohTwitterEmbed";
				document.head.appendChild(script)
			}
		})
	},400);
}
//end modules/tweets.js
//begin modules/twoColumnFeed.js
exportModule({
	id: "twoColumnFeed",
	description: "$twoColumnFeed_description",
	isDefault: false,
	importance: 0,
	categories: ["Feeds"],
	visible: true,
	css: `
.home .activity-feed{
	grid-template-columns: repeat(2,1fr);
	display: grid;
	grid-column-gap: 15px;
}
.home .activity-feed .activity-entry.activity-text{
	grid-column: 1/3;
}
.home .activity-feed .activity-entry{
	margin-bottom: 15px;
}
`
})

if(useScripts.twoColumnFeed && !useScripts.CSSverticalNav){
	moreStyle.textContent += `
.home{
	margin-left: -15px;
	margin-right: -15px;
}
@media(min-width: 1540px){
	.home{
		margin-left: -95px;
		margin-right: -95px;
	}
}
@media(min-width:1040px) and (max-width:1540px){
	.home{
		margin-left: -45px;
		margin-right: -45px;
	}
}
@media(min-width:760px) and (max-width:1040px){
	.home{
		margin-left: -25px;
		margin-right: -25px;
	}
}
@media(max-width: 1040px){
	.home .activity-anime_list .details,.home .activity-manga_list .details{
		padding-right: 15px;
	}
}
@media(max-width: 760px){
	.home .activity-anime_list .details,.home .activity-manga_list .details{
		padding-top: 35px;
	}
}
@media(max-width: 500px){
	.home .activity-anime_list .cover,.home .activity-manga_list .cover{
		padding-top: 35px;
		max-height: 120px;
	}
	.home .activity-entry > .wrap > .actions{
		width: calc(100% - 25px);
		bottom: 7px;
		display: flex;
	}
	.home .activity-feed{
		grid-column-gap: 10px;
	}
}
`
}
//end modules/twoColumnFeed.js
//begin modules/unicodifier.js
exportModule({
	id: "unicodifier",
	description: "$module_unicodifier_description",
	extendedDescription: "$module_unicodifier_extendedDescription",
	isDefault: true,
	importance: 0,
	categories: ["Feeds","Forum"],
	visible: true
})

setInterval(function(){
	Array.from(document.querySelectorAll(".activity-edit textarea.el-textarea__inner,.editor textarea.el-textarea__inner")).forEach(editor => {
		if(editor.value){
			editor.value = emojiSanitize(editor.value);
			editor.dispatchEvent(new Event("input",{bubbles: false}))
		}
	})
},2000)
//end modules/unicodifier.js
//begin modules/videoMimeTypeFixer.js
exportModule({
	id: "videoMimeTypeFixer",
	description: "$videoMimeTypeFixer_description",
	extendedDescription: `
Anilist by default serves all video as "video/webm".
However, it's common to use non-webm video, as brower support is common.
But some browsers don't autodetect the proper mime type. This module adds a mime type based on the file extension, which may help if the video won't play otherwise.
	`,
	isDefault: false,
	categories: ["Feeds"],
	visible: true
})

if(useScripts.videoMimeTypeFixer){
	setInterval(function(){
		document.querySelectorAll('source[src$=".av1"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/av1")
		})
		document.querySelectorAll('source[src$=".mp4"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/mp4")
		})
		document.querySelectorAll('source[src$=".avi"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/x-msvideo")
		})
		document.querySelectorAll('source[src$=".mpeg"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/mpeg")
		})
		document.querySelectorAll('source[src$=".ogg"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/ogv")
		})
		document.querySelectorAll('source[src$=".ts"][type="video/webm"]').forEach(video => {
			video.setAttribute("type","video/mp2t")
		})
	},2000)
}
//end modules/videoMimeTypeFixer.js
//begin modules/viewAdvancedScores.js
function viewAdvancedScores(url){
	let URLstuff = url.match(/^https:\/\/anilist\.co\/user\/(.+)\/(anime|manga)list\/?/);
	let name = decodeURIComponent(URLstuff[1]);
	generalAPIcall(
		`query($name:String!){
			User(name:$name){
				mediaListOptions{
					animeList{advancedScoringEnabled}
					mangaList{advancedScoringEnabled}
				}
			}
		}`,
		{name: name},function(data){
		if(
			!(
				(URLstuff[2] === "anime" && data.data.User.mediaListOptions.animeList.advancedScoringEnabled)
				|| (URLstuff[2] === "manga" && data.data.User.mediaListOptions.mangaList.advancedScoringEnabled)
			)
		){
			return
		}
		generalAPIcall(
			`query($name:String!,$listType:MediaType){
				MediaListCollection(userName:$name,type:$listType){
					lists{
						entries{mediaId advancedScores}
					}
				}
			}`,
			{name: name,listType: URLstuff[2].toUpperCase()},
			function(data2){
				let list = new Map(returnList(data2,true).map(a => [a.mediaId,a.advancedScores]));
				let finder = function(){
					if(!document.URL.match(/^https:\/\/anilist\.co\/user\/(.+)\/(anime|manga)list\/?/)){
						return
					}
					document.querySelectorAll(
						".list-entries .entry .title > a:not(.hohAdvanced)"
					).forEach(function(entry){
						entry.classList.add("hohAdvanced");
						let key = parseInt(entry.href.match(/\/(\d+)\//)[1]);
						let dollar = create("span",["hohAdvancedDollar","noselect"],"$",entry.parentNode);
						let advanced = list.get(key);
						let reasonable = Object.keys(advanced).map(
							key => [key,advanced[key]]
						).filter(
							a => a[1]
						);
						dollar.dataset.tooltip = reasonable.map(
							a => a[0] + ": " + a[1]
						).join("\n");
						if(!reasonable.length){
							dollar.style.display = "none"
						}
					});
					setTimeout(finder,1000);
				};finder();
			}
		)
	})
}
//end modules/viewAdvancedScores.js
//begin modules/webmResize.js
exportModule({
	id: "webmResize",
	description: "$webmResize_description",
	isDefault: true,
	categories: ["Feeds"],
	visible: true
})

if(useScripts.webmResize){
	setInterval(function(){
		document.querySelectorAll("source").forEach(video => {
			let hashMatch = (video.src || "").match(/#(image)?(\d+(\.\d+)?%?)$/);
			if(hashMatch && !video.parentNode.width){
				video.parentNode.setAttribute("width",hashMatch[2])
			}
			if(video.src.match(/#image\d*(\.\d+)?%?$/)){
				video.parentNode.removeAttribute("controls")
			}
		})
	},500)
}
//end modules/webmResize.js
//begin modules/yearStepper.js
exportModule({
	id: "yearStepper",
	description: "$yearStepper_description",
	isDefault: true,
	importance: 0,
	categories: ["Lists"],
	visible: true,
	urlMatch: function(url,oldUrl){
		return url.match(/\/user\/.*\/(anime|manga)list/)
	},
	code: function(){
		let yearStepper = function(){
			if(!location.pathname.match(/\/user\/.*\/(anime|manga)list/)){
				return
			}
			let slider = document.querySelector(".el-slider");
			if(!slider){
				setTimeout(yearStepper,200);
				return
			}
			const maxYear = parseInt(slider.getAttribute("aria-valuemax"));
			const minYear = parseInt(slider.getAttribute("aria-valuemin"));
			const yearRange = maxYear - minYear;
			let clickSlider = function(year){//thanks, mator!
				let runway = slider.children[0];
				let r = runway.getBoundingClientRect();
				const x = r.left + r.width * ((year - minYear) / yearRange);
				const y = r.top + r.height / 2;
				runway.dispatchEvent(new MouseEvent("click",{
					clientX: x,
					clientY: y
				}))
			};
			let adjuster = function(delta){
				let heading = slider.previousElementSibling;
				if(heading.children.length === 0){
					if(delta === -1){
						clickSlider(maxYear)
					}
					else{
						clickSlider(minYear + 1)
					}
				}
				else{
					let current = parseInt(heading.children[0].innerText);
					clickSlider(current + delta)
				}
			};
			if(document.querySelector(".hohStepper")){
				return
			}
			slider.style.position = "relative";
			let decButton = create("span",["hohStepper","noselect"],"<",slider,"left:-27px;font-size:200%;top:0px;");
			let incButton = create("span",["hohStepper","noselect"],">",slider,"right:-27px;font-size:200%;top:0px;");
			decButton.onclick = function(){
				adjuster(-1)
			};
			incButton.onclick = function(){
				adjuster(1)
			}
		};yearStepper()
	},
	css: `
.hohStepper{
	cursor: pointer;
	position: absolute;
	opacity: 0.5;
}
.el-slider:hover .hohStepper{
	opacity: 1;
}`
})
//end modules/yearStepper.js
//begin modules/youtubeFullscreen.js
exportModule({
	id: "youtubeFullscreen",
	description: "$youtubeFullscreen_description",
	isDefault: false,
	categories: ["Feeds"],
	visible: true
})

if(useScripts.youtubeFullscreen){
	setInterval(function(){
		document.querySelectorAll(".youtube iframe").forEach(video => {
			if(!video.hasAttribute("allowfullscreen")){
				video.setAttribute("allowfullscreen","allowfullscreen");
				video.setAttribute("frameborder","0");
				video.setAttribute("src",video.getAttribute("src").replace("autohide=1","autohide=0"))
			}
		})
	},1000)
}
//end modules/youtubeFullscreen.js
