var apiUrl = "https://borcdefteriapi.kod.fun/";
var pathname = window.location.pathname;

// functions
function getAccessToken() {
    var loginDataJson = sessionStorage["login"] || localStorage["login"];
    var loginData;
    try {
        loginData = JSON.parse(loginDataJson);
    } catch (error) {
        return null;
    }

    if (!loginData || !loginData.access_token) {
        return null;
    }

    return loginData.access_token;
}

function getAuthHeaders() {
    return { Authorization: "Bearer " + getAccessToken() };
}

function girisKontrol() {
    if (pathname.endsWith("/giris.html")) return;

    var accessToken = getAccessToken();

    if (!accessToken) {
        window.location.href = "giris.html";
        return;
    }

    // token şu an elimizde ama geçerli mi?
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Account/UserInfo",
        success: function (data) {
            $("#loginAd").text(data.Email);
            borclariListele();
            $(".gizle").removeClass("gizle");
        },
        error: function () {
            window.location.href = "giris.html";
        }
    });
}

function borclariListele() {
    $.ajax({
        type: "get",
        headers: getAuthHeaders(),
        url: apiUrl + "api/Borclar/Listele",
        success: function (data) {
            borclariTabloyaEkle(data);
        },
        error: function () {

        }
    });
}

function borclariTabloyaEkle(borclar) {
    for (var i = 0; i < borclar.length; i++) {
        borcuTabloyaEkle(borclar[i]);
    }
}

function borcuTabloyaEkle(borc) {
    var html =
        '<tr class="' + (borc.BorcluMuyum ? 'tarafAlacakli' : 'tarafBorclu') + '">' +
        '<td>' + borc.Taraf + '</td>' +
        '<td class="borcMiktarSutun">' + borc.BorcMiktar.toFixed(2) + '</td>' +
        '<td>' + tarihBicimlendir(borc.SonOdemeTarihi) + '</td>' +
        '<td>' + borcKapandiSwitch(borc.BorcKapandiMi, borc.Id) + '</td>' +
        '</tr>';
    $("#tblBorclar tbody").append(html);
}

function borcKapandiSwitch(borcKapandiMi, borcId) {
    var elemId = "chkKapandi-" + borcId;
    return '<div class="custom-control custom-switch">' +
        '<input type="checkbox" class="custom-control-input" data-borc-switch-id="' + borcId + '" id="' + elemId + '"' + (borcKapandiMi ? " checked": "") + '>' +
        '<label class="custom-control-label" for="' + elemId + '"></label>' +
        '</div>';
}

// isoTarih: 2020-12-31T23:59:59
function tarihBicimlendir(isoTarih) {
    if (!isoTarih) {
        return "";
    }

    var tarih = new Date(isoTarih);
    return tarih.toLocaleDateString();
}

// events
$("#btnCikisYap").click(function (event) {
    event.preventDefault();
    localStorage.removeItem("login");
    sessionStorage.removeItem("login");
    window.location.href = "giris.html";
});

$("#frmGiris").submit(function (event) {
    var frmGiris = this;
    var hatirla = $("#rememberme").prop("checked"); // true | false
    event.preventDefault();

    $.ajax({
        type: "post",
        url: apiUrl + "Token",
        data: {
            grant_type: "password",
            username: $("#inputEmail").val(),
            password: $("#inputPassword").val()
        },
        success: function (data) {
            frmGiris.reset();
            localStorage.removeItem("login");
            sessionStorage.removeItem("login");
            var storage = hatirla ? localStorage : sessionStorage;
            storage["login"] = JSON.stringify(data);

            $("#basari").text("Giriş başarılı. Anasayfaya yönlendiriliyor..").show();
            setTimeout(function () {
                location.href = "";
            }, 1000);
        },
        error: function (xhr, status, error) {
            if (xhr.responseJSON.error == "invalid_grant") {
                $("#hata").text("Kullanıcı adı ya da parola yanlış!").show();
            }
        }
    });
});

$("#frmGiris").on("input", function () {
    $("#hata").hide();
});

$(document).ajaxStart(function () {
    $("#loading").removeClass("d-none");
});

$(document).ajaxStop(function () {
    $("#loading").addClass("d-none");
});

$("#frmBorc").submit(function (event) {
    event.preventDefault();
    var frm = this;

    $.ajax({
        type: "post",
        url: apiUrl + "api/Borclar/Ekle",
        headers: getAuthHeaders(),
        data: $(frm).serialize(),
        success: function (data) {
            frm.reset();
            borcuTabloyaEkle(data);
        },
        error: function (xhr, status, error) {
            console.log("eklenirken hata");
        }
    });
});

$("body").on("change", "[data-borc-switch-id]", function(event) {
    var borcId = $(this).data("borc-switch-id");
    var borcKapandiMi = $(this).prop("checked");
    
    $.ajax({
        type: "put",
        url: apiUrl + "api/Borclar/KapanmaDurumGuncelle/" + borcId,
        headers: getAuthHeaders(),
        data: { BorcId: borcId, BorcKapandiMi: borcKapandiMi },
        success: function (data) {

        },
        error: function (xhr, status, error) {
            console.log("borç kapama güncelle hata");
        }
    });
});

girisKontrol();